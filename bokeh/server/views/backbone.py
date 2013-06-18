from flask import (
        render_template, request,
        send_from_directory, make_response)
import flask
import os
import logging
import uuid
import urlparse
from ..app import app
from ..serverbb import RedisSession
from .. import wsmanager
from ..models import convenience
from ..models import docs
from ... import protocol
from bbauth import (check_read_authentication_and_create_client,
                    check_write_authentication_and_create_client)
from ..crossdomain import crossdomain
from ..views import make_json
log = logging.getLogger(__name__)


#Management Functions

@app.route("/bokeh/bb/<docid>/reset", methods=['GET'])
@check_write_authentication_and_create_client
def reset(docid):
    sess = RedisSession(app.bb_redis, docid)
    doc = docs.Doc.load(app.model_redis, docid)
    sess.load(doc)
    sess.load_all_callbacks()
    for m in sess._models:
        if not m.typename.endswith('PlotContext'):
            sess.del_obj(m)
        else:
            m.children = []
            sess.store_obj(m)
    return 'success'

@app.route("/bokeh/bb/<docid>/rungc", methods=['GET'])
@check_write_authentication_and_create_client
def rungc(docid):
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, docid)
    sess.load(doc)
    sess.load_all_callbacks()    
    all_models = sess._models.values()
    return 'success'

@app.route("/bokeh/bb/<docid>/callbacks", methods=['POST', 'GET'])
@check_write_authentication_and_create_client
def callbacks(docid):
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, docid)
    sess.load(doc)
    sess.load_all_callbacks()    
    if request.method == 'POST':
        jsondata = protocol.deserialize_json(request.data)
        sess.store_callbacks(jsondata)
    else:
        jsondata = sess.load_all_callbacks(get_json=True)
    return make_json(sess.serialize(jsondata))

#bulk upsert
@app.route("/bokeh/bb/<docid>/bulkupsert", methods=['POST'])
@check_write_authentication_and_create_client
def bulk_upsert(docid):
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, docid)
    sess.load(doc)
    sess.load_all_callbacks()    
    data = protocol.deserialize_json(request.data)
    models = sess.load_broadcast_attrs(data)
    changed = sess.store_all()
    msg = ws_update(sess, changed)
    return make_json(msg)

def ws_update(session, models):
    attrs = session.broadcast_attrs(models)
    clientid = request.headers.get('Continuum-Clientid', None)
    msg = session.serialize({'msgtype' : 'modelpush',
                             'modelspecs' : attrs
                             })
    app.wsmanager.send("bokehplot:" + session.docid, msg, exclude={clientid})
    return msg
        
def ws_delete(session, models):
    attrs = sess.broadcast_attrs(models)    
    msg = {'msgtype' : 'modeldel',
           'modelspecs' : attrs
           }
    msg = session.serialize(msg)
    app.wsmanager.send("bokehplot:" + session.docid, msg, exclude={clientid})
    return msg
    
#backbone functionality

@app.route("/bokeh/bb/<docid>/<typename>/", methods=['POST'])
@check_write_authentication_and_create_client
def create(docid, typename):
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, docid)
    sess.load(doc)
    sess.load_all_callbacks()
    modeldata = protocol.deserialize_json(request.data)
    modeldata = [{'type' : typename,
                  'attributes' : modeldata}]
    sess.store_broadcast_attrs(modeldata)
    ws_update(sess, modeldata)
    return sess.serialize(modeldata[0]['attributes'])

@app.route("/bokeh/bb/<docid>/", methods=['GET'])
@app.route("/bokeh/bb/<docid>/<typename>/", methods=['GET'])
@check_read_authentication_and_create_client
def bulkget(docid, typename=None):
    include_hidden = request.values.get('include_hidden', '').lower() == 'true'
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, docid)
    sess.load(doc)
    sess.load_all_callbacks()    
    all_models = sess._models.values()
    if typename is not None:
        attrs = sess.attrs([x for x in all_models \
                            if x.__view_model__==typename])
        return make_json(sess.serialize(attrs))
    else:
        attrs = sess.broadcast_attrs([x for x in all_models])
        return make_json(sess.serialize(attrs))

#route for working with individual models
@app.route("/bokeh/bb/<docid>/<typename>/<id>/",
           methods=['GET', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'])
@crossdomain(origin="*", methods=['PATCH', 'GET', 'PUT'],
             headers=['BOKEH-API-KEY', 'Continuum-Clientid', 'Content-Type'])
def handle_specific_model(docid, typename, id):
    if request.method == 'PUT':
        return update(docid, typename, id)
    elif request.method == 'PATCH':
        return update(docid, typename, id)
    elif request.method == 'GET':
        return getbyid(docid, typename, id)
    elif request.method =='DELETE':
        return delete(docid, typename, id)
    
##individual model methods
@check_read_authentication_and_create_client
def getbyid(docid, typename, id):
    include_hidden = request.values.get('include_hidden', '').lower() == 'true'
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, docid)
    sess.load(doc)
    sess.load_all_callbacks()    
    attr = sess.attrs([sess._models[id]])[0]
    return make_json(sess.serialize(attr))

@check_write_authentication_and_create_client
def update(docid, typename, id):
    """we need to distinguish between writing and patching models
    namely in writing, we shouldn't remove unspecified attrs
    (we currently don't handle this correctly)
    """
    doc = docs.Doc.load(app.model_redis, docid)
    modeldata = protocol.deserialize_json(request.data)
    sess = RedisSession(app.bb_redis, docid)
    sess.load(doc)
    sess.load_all_callbacks()
    sess.load_attrs(typename, [modeldata])
    changed = sess.store_all()
    ws_update(sess, changed)
    model = sess._models[id]
    log.debug("patch, %s, %s", docid, typename)
    return make_json(sess.attrs([model])[0])

@check_write_authentication_and_create_client
def delete(docid, typename, id):
    sess = RedisSession(app.bb_redis, docid)    
    model = sess._models[id]
    log.debug("DELETE, %s, %s", docid, typename)
    sess.del_obj(model)
    ws_delete(sess, [model])
    return sess.serialize(sess.attrs([model])[0])
