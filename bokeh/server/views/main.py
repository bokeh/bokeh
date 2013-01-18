from flask import (
    render_template, request, current_app,
    send_from_directory, make_response)
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

#main pages

@app.route('/bokeh/')
@app.route('/bokeh/<path:unused>/')
def index(*unused_all, **kwargs):
    return render_template('bokeh.html')


@app.route('/bokeh/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/x-icon')

@app.route('/bokeh/userinfo/')
def get_user():
    bokehuser = app.current_user(request)
    return current_app.ph.serialize_web(bokehuser.to_public_json())

def _make_plot_file(docid, apikey, url):
    lines = ["from bokeh import mpl",
             "p = mpl.PlotClient('%s', '%s', '%s')" % (docid, url, apikey)]
    return "\n".join(lines)

def write_plot_file(docid, apikey, url):
    bokehuser = app.current_user(request)
    codedata = _make_plot_file(docid, apikey, url)
    app.write_plot_file(bokehuser.username, codedata)

@app.route('/bokeh/bokehinfo/<docid>')
def get_bokeh_info(docid):
    doc = docs.Doc.load(app.model_redis, docid)
    bokehuser = app.current_user(request)
    if not mconv.can_write_doc(doc, bokehuser):
        return null
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
    write_plot_file(docid, doc.apikey, request.scheme + "://" + request.host)
    return (returnval, "200",
            {"Access-Control-Allow-Origin": "*"})

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

