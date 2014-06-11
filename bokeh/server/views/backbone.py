from flask import (
        render_template, request,
        send_from_directory, make_response, g)
import flask
import os
import logging
import uuid
from ..app import bokeh_app
from .. import wsmanager
from ..models import convenience
from ..models import docs
from ... import protocol
from .bbauth import (check_read_authentication_and_create_client,
                    check_write_authentication_and_create_client)
from ..crossdomain import crossdomain
from ..views import make_json
from ..serverbb import prune
log = logging.getLogger(__name__)

def init_bokeh(clientdoc):
    request.bokeh_server_document = clientdoc
    clientdoc.autostore(False)
    clientdoc.autoadd(False)
#Management Functions

@bokeh_app.route("/bokeh/bb/<docid>/reset", methods=['GET'])
@check_write_authentication_and_create_client
def reset(docid):
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    for m in clientdoc._models:
        if not m.typename.endswith('PlotContext'):
            bokeh_app.backbone_storage.del_obj(docid, m)
        else:
            m.children = []
            bokeh_app.backbone_storage.store_objects(docid, m)
    return 'success'

@bokeh_app.route("/bokeh/bb/<docid>/rungc", methods=['GET'])
@check_write_authentication_and_create_client
def rungc(docid):
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc, delete=True)
    return 'success'

@bokeh_app.route("/bokeh/bb/<docid>/callbacks", methods=['POST', 'GET'])
@check_write_authentication_and_create_client
def callbacks(docid):
    #broken...
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    if request.method == 'POST':
        jsondata = protocol.deserialize_json(request.data.decode('utf-8'))
        bokeh_app.backbone_storage.push_callbacks(jsondata)
    else:
        jsondata = bokeh_app.backbone_storage.load_callbacks()
    return make_json(protocol.serialize_json(jsondata))

#bulk upsert
@bokeh_app.route("/bokeh/bb/<docid>/bulkupsert", methods=['POST'])
@check_write_authentication_and_create_client
def bulk_upsert(docid):
    # endpoint is only used by python, therefore we don't process
    # callbacks here
    client = request.headers.get('client', 'python')
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    data = protocol.deserialize_json(request.data.decode('utf-8'))
    if client == 'python':
        clientdoc.load(*data, events=None, dirty=True)
    else:
        clientdoc.load(*data, events='existing', dirty=True)
    changed = bokeh_app.backbone_storage.store_document(clientdoc)
    msg = ws_update(clientdoc, changed)
    return make_json(msg)

def ws_update(clientdoc, models, exclude_self=True):
    attrs = clientdoc.dump(*models)
    if exclude_self:
        clientid = request.headers.get('Continuum-Clientid', None)
    else:
        clientid = None
    msg = protocol.serialize_json({'msgtype' : 'modelpush',
                                   'modelspecs' : attrs
                               })
    bokeh_app.wsmanager.send("bokehplot:" + clientdoc.docid, msg, exclude=set([clientid]))
    return msg
        
def ws_delete(clientdoc, models):
    attrs = clientdoc.dump(*models)    
    msg = {'msgtype' : 'modeldel',
           'modelspecs' : attrs
           }
    msg = protocol.serialize_json(msg)
    bokeh_app.wsmanager.send("bokehplot:" + clientdoc.docid, msg, exclude=set([clientid]))
    return msg
    
#backbone functionality
@bokeh_app.route("/bokeh/bb/<docid>/<typename>/", methods=['POST'])
@check_write_authentication_and_create_client
def create(docid, typename):
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    modeldata = protocol.deserialize_json(request.data.decode('utf-8'))
    modeldata = {'type' : typename,
                 'attributes' : modeldata}
    clientdoc.load(modeldata, dirty=True)
    bokeh_app.backbone_storage.store_document(clientdoc)
    ws_update(clientdoc, modeldata)
    return protocol.serialize_json(modeldata[0]['attributes'])

@bokeh_app.route("/bokeh/bb/<docid>/", methods=['GET'])
@bokeh_app.route("/bokeh/bb/<docid>/<typename>/", methods=['GET'])
@check_read_authentication_and_create_client
def bulkget(docid, typename=None):
    include_hidden = request.values.get('include_hidden', '').lower() == 'true'
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    all_models = clientdoc._models.values()
    if typename is not None:
        attrs = clientdoc.dump(*[x for x in all_models \
                                if x.__view_model__==typename])
        attrs = [x['attributes'] for x in attrs]
        return make_json(protocol.serialize_json(attrs))
    else:
        attrs = clientdoc.dump(*all_models)
        return make_json(protocol.serialize_json(attrs))

#route for working with individual models
@bokeh_app.route("/bokeh/bb/<docid>/<typename>/<id>/",
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
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    attr = clientdoc.dump(clientdoc._models[id])[0]['attributes']
    return make_json(protocol.serialize_json(attr))

@check_write_authentication_and_create_client
def update(docid, typename, id):
    """we need to distinguish between writing and patching models
    namely in writing, we shouldn't remove unspecified attrs
    (we currently don't handle this correctly)
    """
    log.info("loading models")
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    log.info("loading done %s", len(clientdoc._models.values()))
    prune(clientdoc)
    init_bokeh(clientdoc)
    log.info("updating")
    modeldata = protocol.deserialize_json(request.data.decode('utf-8'))
    #patch id is not passed...
    modeldata['id'] = id
    modeldata = {'type' : typename,
                 'attributes' : modeldata}
    clientdoc.load(modeldata, events='existing', dirty=True)
    log.info("done")
    log.info("saving")
    changed = bokeh_app.backbone_storage.store_document(clientdoc)
    model = clientdoc._models[id]
    try:
        idx = changed.index(model)
        del changed[idx]
    except ValueError as e:
        #this is strange but ok, that means the model didn't change
        pass
    log.debug("changed, %s", str(changed))
    log.info("done")
    log.info("publishing")
    ws_update(clientdoc, changed, exclude_self=False)
    ws_update(clientdoc, [model], exclude_self=True)
    log.debug("update, %s, %s", docid, typename)
    attrs = clientdoc.dump(model)[0]['attributes']
    log.info("done")
    return make_json(protocol.serialize_json(attrs))

@check_write_authentication_and_create_client
def delete(docid, typename, id):
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    model = clientdoc._models[id]
    clientdoc.del_obj(docid, model)
    ws_delete(clientdoc, [model])
    return make_json(protocol.serialize_json(clientdoc.dump(model)[0]['attributes']))


#rpc route
@bokeh_app.route("/bokeh/bb/rpc/<docid>/<typename>/<id>/<funcname>/",
           methods=['POST', 'OPTIONS'])
@crossdomain(origin="*", methods=['POST'],
             headers=['BOKEH-API-KEY', 'Continuum-Clientid', 'Content-Type'])
@check_write_authentication_and_create_client
def rpc(docid, typename, id, funcname):
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    model = clientdoc._models[id]
    data = protocol.deserialize_json(request.data.decode('utf-8'))
    args = data.get('args', [])
    kwargs = data.get('kwargs', {})
    result = getattr(model, funcname)(*args, **kwargs)
    log.debug("rpc, %s, %s", docid, typename)
    changed = bokeh_app.backbone_storage.store_document(clientdoc)
    ws_update(clientdoc, changed, exclude_self=False)
    return make_json(protocol.serialize_json(result))
