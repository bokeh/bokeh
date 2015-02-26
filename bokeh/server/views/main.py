from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

import os
import uuid

from flask import (
    render_template, request, send_from_directory,
    abort, jsonify, Response, redirect, url_for
)
from six import string_types

from bokeh import protocol
from bokeh.exceptions import DataIntegrityException
from bokeh.resources import Resources
from bokeh.templates import AUTOLOAD

from .bbauth import handle_auth_error
from ..app import bokeh_app
from ..crossdomain import crossdomain
from ..models import docs
from ..models import user
from ..serverbb import prune, BokehServerTransaction, get_temporary_docid
from ..views import make_json
from ..views.decorators import login_required
from ..settings import settings as server_settings

def request_resources():
    """Creates resources instance based on url info from
    current app/request context
    """
    if bokeh_app.url_prefix:
        # strip of leading slash
        root_url  = request.url_root + bokeh_app.url_prefix[1:]
    else:
        root_url  = request.url_root
    resources = Resources(root_url=root_url, mode='server')
    return resources

def render(fname, **kwargs):
    resources = request_resources()
    bokeh_prefix = resources.root_url
    return render_template(fname, bokeh_prefix=bokeh_prefix,
                           **kwargs)

@bokeh_app.route('/bokeh/ping')
def ping():
    ''' Test whether Bokeh server is up.

    :status 200:

    '''
    # test route, to know if the server is up
    return "pong"

@bokeh_app.route('/')
@bokeh_app.route('/bokeh/')
def index(*unused_all, **kwargs):
    ''' Render main page.

    :status 200: if current user logged in
    :status 302: otherwise redirect to login

    '''
    bokehuser = bokeh_app.current_user()
    if not bokehuser:
        return redirect(url_for('.login_get'))
    return render('bokeh.html',
                  splitjs=server_settings.splitjs,
                  username=bokehuser.username,
                  title="Bokeh Documents for %s" % bokehuser.username
    )

@bokeh_app.route('/bokeh/favicon.ico')
def favicon():
    ''' Return favicon.

    :status 200: return favicon

    '''
    return send_from_directory(os.path.join(bokeh_app.root_path, 'static'),
                               'favicon.ico', mimetype='image/x-icon')

def _makedoc(redisconn, u, title):
    docid = str(uuid.uuid4())
    if isinstance(u, string_types):
        u = user.User.load(redisconn, u)
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    if u is not None:
        rw_users = [u.username]
        u.add_doc(docid, title)
        u.save(redisconn)
    else:
        #anonyomus user case
        rw_users = []
    doc = docs.new_doc(bokeh_app, docid,
                       title, clientdoc,
                       rw_users=rw_users)
    bokeh_app.backbone_storage.store_document(clientdoc)
    return doc

@bokeh_app.route('/bokeh/doc', methods=['POST'])
@bokeh_app.route('/bokeh/doc/', methods=['POST'])
@login_required
def makedoc():
    if request.json:
        title = request.json['title']
    else:
        title = request.values['title']
    bokehuser = bokeh_app.current_user()
    try:
        _makedoc(bokeh_app.servermodel_storage, bokehuser, title)
    except DataIntegrityException as e:
        return abort(409, e.message)
    jsonstring = protocol.serialize_web(bokehuser.to_public_json())
    msg = protocol.serialize_web({'msgtype' : 'docchange'})
    bokeh_app.publisher.send("bokehuser:" + bokehuser.username, msg)
    return make_json(jsonstring)

@bokeh_app.route('/bokeh/doc/<docid>', methods=['delete'])
@bokeh_app.route('/bokeh/doc/<docid>/', methods=['delete'])
@login_required
def deletedoc(docid):
    bokehuser = bokeh_app.current_user()
    try:
        bokehuser.remove_doc(docid)
        bokehuser.save(bokeh_app.servermodel_storage)
    except DataIntegrityException as e:
        return abort(409, e.message)
    jsonstring = protocol.serialize_web(bokehuser.to_public_json())
    msg = protocol.serialize_web({'msgtype' : 'docchange'})
    bokeh_app.publisher.send("bokehuser:" + bokehuser.username, msg)
    return make_json(jsonstring)

@bokeh_app.route('/bokeh/getdocapikey/<docid>')
@handle_auth_error
def get_doc_api_key(docid):
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    bokehuser = bokeh_app.current_user()
    t = BokehServerTransaction(bokehuser, doc, 'auto')
    if t.mode == 'rw':
        return jsonify({'apikey' : t.server_docobj.apikey})
    else:
        return jsonify({'readonlyapikey' : t.server_docobj.readonlyapikey})


@bokeh_app.route('/bokeh/userinfo/', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=None)
@login_required
def get_user():
    bokehuser = bokeh_app.current_user()
    content = protocol.serialize_web(bokehuser.to_public_json())
    return make_json(content)

@bokeh_app.route('/bokeh/doc/<docid>/', methods=['GET', 'OPTIONS'])
@bokeh_app.route('/bokeh/bokehinfo/<docid>/', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=None)
@handle_auth_error
def get_bokeh_info(docid):
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    bokehuser = bokeh_app.current_user()
    temporary_docid = get_temporary_docid(request, docid)
    t = BokehServerTransaction(bokehuser, doc, 'r',
                               temporary_docid=temporary_docid
    )
    t.load()
    clientdoc = t.clientdoc
    all_models = clientdoc._models.values()
    log.info("num models: %s", len(all_models))
    all_models = clientdoc.dump(*all_models)
    returnval = {'plot_context_ref' : doc.plot_context_ref,
                 'docid' : docid,
                 'all_models' : all_models,
                 'apikey' : t.apikey}
    returnval = protocol.serialize_json(returnval)
    #i don't think we need to set the header here...
    result = make_json(returnval,
                       headers={"Access-Control-Allow-Origin": "*"})
    return result

@bokeh_app.route('/bokeh/doc/<title>/show', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=None)
@login_required
def show_doc_by_title(title):
    bokehuser = bokeh_app.current_user()
    docs = [ doc for doc in bokehuser.docs if doc['title'] == title ]
    doc = docs[0] if len(docs) != 0 else abort(404)
    docid = doc['docid']
    return render('show.html', title=title, docid=docid, splitjs=server_settings.splitjs)

@bokeh_app.route('/bokeh/doc/', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=None)
@login_required
def doc_by_title():
    if request.json:
        title = request.json['title']
    else:
        title = request.values['title']
    bokehuser = bokeh_app.current_user()
    docs = [doc for doc in bokehuser.docs if doc['title'] == title]
    if len(docs) == 0:
        try:
            doc = _makedoc(bokeh_app.servermodel_storage, bokehuser, title)
            docid = doc.docid
        except DataIntegrityException as e:
            return abort(409, e.message)
        msg = protocol.serialize_web({'msgtype' : 'docchange'})
        bokeh_app.publisher.send("bokehuser:" + bokehuser.username, msg)
    else:
        doc = docs[0]
        docid = doc['docid']
    return get_bokeh_info(docid)


@bokeh_app.route('/bokeh/sampleerror')
def sampleerror():
    return 1 + "sdf"


@bokeh_app.route("/bokeh/autoload.js/<elementid>")
def autoload_js(elementid):
    ''' Return autoload script for given elementid

    :param elementid: DOM element ID to target

    :status 200: return script

    '''
    resources = request_resources()
    rendered = AUTOLOAD.render(
        js_url = resources.js_files[0],
        css_files = resources.css_files,
        elementid = elementid,
    )
    return Response(rendered, 200,
                    {'Content-Type':'application/javascript'})

@bokeh_app.route('/bokeh/objinfo/<docid>/<objid>', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=None)
@handle_auth_error
def get_bokeh_info_one_object(docid, objid):
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    bokehuser = bokeh_app.current_user()
    temporary_docid = get_temporary_docid(request, docid)
    t = BokehServerTransaction(
        bokehuser, doc, 'r', temporary_docid=temporary_docid
    )
    t.load()
    clientdoc = t.clientdoc
    obj = clientdoc._models[objid]
    objs = obj.references()
    all_models = clientdoc.dump(*objs)
    returnval = {'plot_context_ref' : doc.plot_context_ref,
                 'docid' : docid,
                 'all_models' : all_models,
                 'apikey' : t.apikey,
                 'type' : obj.__view_model__
    }
    returnval = protocol.serialize_json(returnval)
    result = make_json(returnval,
                       headers={"Access-Control-Allow-Origin": "*"})
    return result

@bokeh_app.route('/bokeh/doc/<docid>/<objid>', methods=['GET'])
def show_obj(docid, objid):
    bokehuser = bokeh_app.current_user()
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    if not bokehuser and not doc.published:
        return redirect(url_for(".login_get", next=request.url))
    resources = request_resources()
    public = request.values.get('public', 'false').lower() == 'true'
    if public:
        public = 'true'
    else:
        public = 'false'
    return render("oneobj.html",
                  elementid=str(uuid.uuid4()),
                  docid=docid,
                  objid=objid,
                  public=public,
                  hide_navbar=True,
                  splitjs=server_settings.splitjs,
                  loglevel=resources.log_level)

@bokeh_app.route('/bokeh/wsurl/', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=None)
def wsurl():
    if server_settings.ws_conn_string:
        return server_settings.ws_conn_string
    if request.scheme == "http":
        scheme = 'ws'
    else:
        scheme = 'wss'
    url = "%s://%s%s" % (scheme,
                         request.host,
                         server_settings.url_prefix + "/bokeh/sub")
    return url
