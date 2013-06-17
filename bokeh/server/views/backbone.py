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


#backbone model apis
@app.route("/bokeh/bb/<docid>/reset", methods=['GET'])
@check_write_authentication_and_create_client
def reset(docid):
    sess = RedisSession(app.bb_redis, docid)
    sess.load()
    for m in sess._models:
        if not m.typename.endswith('PlotContext'):
            sess.del_obj(m)
        else:
            m.children = []
            sess.store_obj(m)
    return 'success'

#backbone model apis
@app.route("/bokeh/bb/<docid>/rungc", methods=['GET'])
@check_write_authentication_and_create_client
def rungc(docid):
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, docid)
    sess.load()    
    all_models = docs.prune_and_get_valid_models(doc, sess, delete=True)
    return 'success'

@app.route("/bokeh/bb/<docid>/bulkupsert", methods=['POST'])
@check_write_authentication_and_create_client
def bulk_upsert(docid):
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, docid)
    sess.load()    
    data = protocol.deserialize_json(request.data)
    models = sess.load_broadcast_attrs(data)
    sess.store_all()
    clientid = request.headers.get('Continuum-Clientid', None)
    specs = sess.broadcast_attrs(models)
    msg = dict(msgtype='modelpush',
               modelspecs=specs)
    msg = sess.serialize(msg)
    app.wsmanager.send("bokehplot:" + docid, msg,  exclude={clientid})
    return sess.serialize(msg)

@app.route("/bokeh/bb/<docid>/<typename>/", methods=['POST'])
@check_write_authentication_and_create_client
def create(docid, typename):
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, docid)
    modeldata = protocol.deserialize_json(request.data)
    modeldata['doc'] = docid
    sess.store_broadcast_attrs([{'type' : typename,
                                 'attributes' : modeldata}])
    clientid=request.headers.get('Continuum-Clientid', None)
    msg = protocol.serialize_json(
        {'msgtype' : 'modelpush',
         'modelspecs' : [modeldata]
         })
    app.wsmanager.send("bokehplot:" + docid, msg, exclude={clientid})
    return protocol.serialize_json(modeldata)

@app.route("/bokeh/bb/<docid>/", methods=['GET'])
@app.route("/bokeh/bb/<docid>/<typename>/", methods=['GET'])
@check_read_authentication_and_create_client
def get(docid, typename=None):
    include_hidden = request.values.get('include_hidden', '').lower() == 'true'
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, docid)
    sess.load()
    all_models = docs.prune_and_get_valid_models(doc, sess, delete=False)
    if typename is not None:
        attrs = sess.attrs([x for x in all_models \
                            if x.typename==typename])
        return make_json(sess.serialize(attrs))
    else:
        attrs = sess.broadcast_attrs([x for x in all_models])
        return make_json(sess.serialize(attrs))
    
@app.route("/bokeh/bb/<docid>/<typename>/<id>/",
           methods=['GET', 'OPTIONS', 'PUT','PATCH'])
@crossdomain(origin="*", methods=['PATCH', 'GET', 'PUT'],
             headers=['BOKEH-API-KEY', 'Continuum-Clientid', 'Content-Type'])
def handle_specific_model(docid, typename, id):
    if request.method == 'PUT':
        return put(docid, typename, id)
    elif request.method == 'PATCH':
        return patch(docid, typename, id)
    elif request.method == 'GET':
        return getbyid(docid, typename, id)
        
@check_read_authentication_and_create_client
def getbyid(docid, typename, id):
    include_hidden = request.values.get('include_hidden', '').lower() == 'true'
    sess = RedisSession(app.bb_redis, docid)
    sess.load()
    attrs = sess._models[id].vm_serialize()
    attrs['doc'] = sess.docid
    return make_json(sess.serialize(attrs))

@check_write_authentication_and_create_client
def patch(docid, typename, id):
    modeldata = protocol.deserialize_json(request.data)
    modeldata['id'] = id
    modeldata['doc'] = docid
    sess = RedisSession(app.bb_redis, docid)
    sess.load_attrs(typename, [modeldata])
    sess.store_all()
    model = sess._models[id]
    log.debug("patch, %s, %s", docid, typename)
    clientid=request.headers.get('Continuum-Clientid', None)
    msg = {'msgtype' : 'modelpush',
           'modelspecs' : sess.broadcast_attrs([model])
           }
    msg = sess.serialize(msg)
    app.wsmanager.send("bokehplot:" + docid, msg, exclude={clientid})
    return make_json(sess.attrs([model])[0])

@check_write_authentication_and_create_client
def put(docid, typename, id):
    """we need to distinguish between writing and patching models
    namely in writing, we shouldn't remove unspecified attrs
    (we currently don't handle this correctly)
    """
    modeldata = protocol.deserialize_json(request.data)
    modeldata['id'] = id
    modeldata['doc'] = docid
    log.debug("put, %s, %s", docid, typename)
    sess = RedisSession(app.bb_redis, docid)    
    sess.load_attrs(typename, [modeldata])
    sess.store_all()
    model = sess._models[id]
    clientid=request.headers.get('Continuum-Clientid', None)
    msg = {'msgtype' : 'modelpush',
           'modelspecs' : sess.broadcast_attrs([model])
           }
    msg = sess.serialize(msg)
    app.wsmanager.send("bokehplot:" + docid, msg, exclude={clientid})
    return make_json(sess.attrs([model])[0])

@app.route("/bokeh/bb/<docid>/<typename>/<id>", methods=['DELETE'])
@check_write_authentication_and_create_client
def delete(docid, typename, id):
    sess = RedisSession(app.bb_redis, docid)    
    model = sess._models[id]
    log.debug("DELETE, %s, %s", docid, typename)
    clientid = request.headers.get('Continuum-Clientid', None)
    sess.del_obj(model)
    msg = {'msgtype' : 'modeldel',
           'modelspecs' : sess.broadcast_attrs([model])
           }
    msg = sess.serialize(msg)
    app.wsmanager.send("bokehplot:" + docid, msg, exclude={clientid})
    return sess.serialize(sess.attrs([model])[0])
