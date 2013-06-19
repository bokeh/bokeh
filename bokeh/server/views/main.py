from flask import (
    render_template, request,
    send_from_directory, make_response, abort,
    jsonify
    )
import flask
import os
import logging
import uuid
import urlparse

from ..app import app

from .. import wsmanager
from ..models import user
from ..models import docs
from ..models import convenience as mconv
from ... import protocol
from continuumweb import hemlib
from ...exceptions import DataIntegrityException
from bbauth import (check_read_authentication_and_create_client,
                    check_write_authentication_and_create_client)
from ..views import make_json
from ..crossdomain import crossdomain
from ..serverbb import RedisSession
#main pages

@app.route('/bokeh/')
def index(*unused_all, **kwargs):
    if getattr(app, "debugjs", False):
        slug = hemlib.slug_json()
        static_js = hemlib.slug_libs(app, slug['libs'])
        hem_js = hemlib.all_coffee_assets("localhost", app.hem_port)
    else:
        static_js = ['/bokeh/static/js/application.js']
        hem_js = []
    return render_template('bokeh.html', jsfiles=static_js, hemfiles=hem_js)

@app.route('/bokeh/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/x-icon')

def _makedoc(redisconn, u, title):
    docid = str(uuid.uuid4())
    if isinstance(u, basestring):
        u = user.User.load(redisconn, u)
    sess = RedisSession(app.bb_redis, docid)
    u.add_doc(docid, title)
    doc = docs.new_doc(app, docid,
                       title, sess,
                       rw_users=[u.username])
    u.save(redisconn)
    return doc

@app.route('/bokeh/doc', methods=['POST'])    
@app.route('/bokeh/doc/', methods=['POST'])
def makedoc():
    if request.json:
        title = request.json['title']
    else:
        title = request.values['title']
    bokehuser = app.current_user(request)
    try:
        doc = _makedoc(app.model_redis, bokehuser, title)
    except DataIntegrityException as e:
        return abort(409, e.message)
    jsonstring = protocol.serialize_web(bokehuser.to_public_json())
    msg = protocol.serialize_web({'msgtype' : 'docchange'})
    app.wsmanager.send("bokehuser:" + bokehuser.username, msg)
    return make_json(jsonstring)

@app.route('/bokeh/doc/<docid>', methods=['delete'])
@app.route('/bokeh/doc/<docid>/', methods=['delete'])
def deletedoc(docid):
    bokehuser = app.current_user(request)
    try:
        bokehuser.remove_doc(docid)        
        bokehuser.save(app.model_redis)
    except DataIntegrityException as e:
        return abort(409, e.message)
    jsonstring = protocol.serialize_web(bokehuser.to_public_json())
    msg = protocol.serialize_web({'msgtype' : 'docchange'})
    app.wsmanager.send("bokehuser:" + bokehuser.username, msg)
    return make_json(jsonstring)
    
@app.route('/bokeh/getdocapikey/<docid>')
def get_doc_api_key(docid):
    bokehuser = app.current_user(request)
    doc = docs.Doc.load(app.model_redis, docid)
    if mconv.can_write_from_request(doc, request, app):
        return jsonify({'apikey' : doc.apikey})
    elif mconv.can_write_from_request(doc, request, app):
        return jsonify({'readonlyapikey' : doc.readonlyapikey})
    else:
        return abort(401)
    
@app.route('/bokeh/userinfo/')
def get_user():
    bokehuser = app.current_user(request)
    content = protocol.serialize_web(bokehuser.to_public_json())
    write_plot_file(request.scheme + "://" + request.host)
    return make_json(content)

def _make_plot_file(username, userapikey, url):
    lines = ["from bokeh import mpl",
             "p = mpl.PlotClient(username='%s', serverloc='%s', userapikey='%s')" % (username, url, userapikey)]
    return "\n".join(lines)

def write_plot_file(url):
    bokehuser = app.current_user(request)
    codedata = _make_plot_file(bokehuser.username,
                               bokehuser.apikey,
                               url)
    app.write_plot_file(bokehuser.username, codedata)

@app.route('/bokeh/doc/<docid>/', methods=['GET', 'OPTIONS'])
@app.route('/bokeh/bokehinfo/<docid>/', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=['BOKEH-API-KEY', 'Continuum-Clientid'])
@check_read_authentication_and_create_client
def get_bokeh_info(docid):
    return _get_bokeh_info(docid)

def _get_bokeh_info(docid):
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, doc)
    sess.load()
    all_models = sess._models.values()
    print "num models", len(all_models)
    all_models = sess.broadcast_attrs(all_models)
    returnval = {'plot_context_ref' : doc.plot_context_ref,
                 'docid' : docid,
                 'all_models' : all_models,
                 'apikey' : doc.apikey}
    returnval = sess.serialize(returnval)
    result = make_json(returnval,
                       headers={"Access-Control-Allow-Origin": "*"})
    return result

@app.route('/bokeh/doc/', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=['BOKEH-API-KEY', 'Continuum-Clientid'])
def doc_by_title():
    if request.json:
        title = request.json['title']
    else:
        title = request.values['title']
    bokehuser = app.current_user(request)
    docs = [doc for doc in bokehuser.docs if doc['title'] == title]
    if len(docs) == 0:
        try:
            doc = _makedoc(app.model_redis, bokehuser, title)
            docid = doc.docid
        except DataIntegrityException as e:
            return abort(409, e.message)
        jsonstring = protocol.serialize_web(bokehuser.to_public_json())
        msg = protocol.serialize_web({'msgtype' : 'docchange'})
        app.wsmanager.send("bokehuser:" + bokehuser.username, msg)
    else:
        doc = docs[0]
        docid = doc['docid']
    return get_bokeh_info(docid)

"""need to rethink public publishing
"""
# @app.route('/bokeh/publicbokehinfo/<docid>')
# def get_public_bokeh_info(docid):
#     doc = docs.Doc.load(app.model_redis, docid)
#     plot_context_ref = doc.plot_context_ref
#     all_models = docs.prune_and_get_valid_models(app.model_redis,
#                                                  app.collections,
#                                                  docid)
#     public_models = [x for x in all_models if x.get('public', False)]
#     if len(public_models) == 0:
#         return False
#     all_models_json = [x.to_broadcast_json() for x in all_models]
#     returnval = {'plot_context_ref' : plot_context_ref,
#                  'docid' : docid,
#                  'all_models' : all_models_json,
#                  }
#     returnval = protocol.serialize_web(returnval)
#     #return returnval

#     return (returnval, "200",
#             {"Access-Control-Allow-Origin": "*"})


@app.route('/bokeh/sampleerror')
def sampleerror():
    return 1 + "sdf"

