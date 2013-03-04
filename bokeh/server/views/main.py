from flask import (
    render_template, request, current_app,
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
from .. import hemlib
from ...exceptions import DataIntegrityException
from bbauth import (check_read_authentication_and_create_client,
                    check_write_authentication_and_create_client)
from ..views import make_json

#main pages

@app.route('/bokeh/')
@app.route('/bokeh/<path:unused>/')
def index(*unused_all, **kwargs):
    if app.debug:
        slug = hemlib.slug_json()
        static_js = hemlib.slug_libs(app, slug['libs'])
        hemsource = os.path.join(app.static_folder, "coffee")
        hem_js = hemlib.coffee_assets(hemsource, "localhost", 9294)
        hemsource = os.path.join(app.static_folder, "vendor",
                                 "bokehjs", "coffee")
        hem_js += hemlib.coffee_assets(hemsource, "localhost", 9294)
    else:
        static_js = ['/bokeh/static/js/application.js']
        hem_js = []
    return render_template('bokeh.html', jsfiles=static_js, hemfiles=hem_js)

@app.route('/bokeh/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/x-icon')

@app.route('/bokeh/doc', methods=['POST'])    
@app.route('/bokeh/doc/', methods=['POST'])
def makedoc():
    if request.json:
        title = request.json['title']
    else:
        title = request.values['title']
    bokehuser = app.current_user(request)
    try:
        docid = str(uuid.uuid4())
        bokehuser.add_doc(docid, title)        
        doc = docs.new_doc(app, docid,
                           title,
                           rw_users=[bokehuser.username])
        bokehuser.save(app.model_redis)
    except DataIntegrityException as e:
        return abort(409, e.message)
    jsonstring = current_app.ph.serialize_web(bokehuser.to_public_json())
    return make_json(jsonstring)

@app.route('/bokeh/doc/<docid>', methods=['delete'])
@app.route('/bokeh/doc/<docid>/', methods=['delete'])
def deletedoc(docid):
    bokehuser = app.current_user(request)
    try:
        docid = str(uuid.uuid4())
        bokehuser.remove_doc(docid)        
        bokehuser.save(app.model_redis)
    except DataIntegrityException as e:
        return abort(409, e.message)
    jsonstring = current_app.ph.serialize_web(bokehuser.to_public_json())
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
    content = current_app.ph.serialize_web(bokehuser.to_public_json())
    return make_json(content)

def _make_plot_file(username, userapikey, url):
    lines = ["from bokeh import mpl",
             "p = mpl.PlotClient(username='%s', serverloc='%s', userapikey='%s')" % (docid, url, apikey)]
    return "\n".join(lines)

def write_plot_file(url):
    bokehuser = app.current_user(request)
    codedata = _make_plot_file(bokehuser.username,
                               bokehuser.apikey,
                               url)
    app.write_plot_file(bokehuser.username, codedata)
    
@app.route('/bokeh/doc/<docid>', methods=['GET'])
@app.route('/bokeh/doc/<docid>/', methods=['GET'])    
@app.route('/bokeh/bokehinfo/<docid>')
@check_read_authentication_and_create_client
def get_bokeh_info(docid):
    doc = docs.Doc.load(app.model_redis, docid)
    plot_context_ref = doc.plot_context_ref
    all_models = docs.prune_and_get_valid_models(current_app.model_redis,
                                                 current_app.collections,
                                                 docid)
    print "num models", len(all_models)
    all_models = [x.to_broadcast_json() for x in all_models]
    returnval = {'plot_context_ref' : plot_context_ref,
                 'docid' : docid,
                 'all_models' : all_models,
                 'apikey' : doc.apikey}
    returnval = current_app.ph.serialize_web(returnval)
    write_plot_file(request.scheme + "://" + request.host)
    return make_json(returnval,
                     headers={"Access-Control-Allow-Origin": "*"})

@app.route('/bokeh/publicbokehinfo/<docid>')
def get_public_bokeh_info(docid):
    doc = docs.Doc.load(app.model_redis, docid)
    plot_context_ref = doc.plot_context_ref
    all_models = docs.prune_and_get_valid_models(current_app.model_redis,
                                                 current_app.collections,
                                                 docid)
    public_models = [x for x in all_models if x.get('public', False)]
    if len(public_models) == 0:
        return False
    all_models_json = [x.to_broadcast_json() for x in all_models]
    returnval = {'plot_context_ref' : plot_context_ref,
                 'docid' : docid,
                 'all_models' : all_models_json,
                 }
    returnval = current_app.ph.serialize_web(returnval)
    #return returnval

    return (returnval, "200",
            {"Access-Control-Allow-Origin": "*"})


@app.route('/bokeh/sampleerror')
def sampleerror():
    return 1 + "sdf"

