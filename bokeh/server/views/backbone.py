
import logging
log = logging.getLogger(__name__)

from flask import request

from bokeh import protocol

from .bbauth import (
    check_read_authentication_and_create_client,
    check_write_authentication_and_create_client
)
from ..app import bokeh_app
from ..crossdomain import crossdomain
from ..serverbb import prune
from ..views import make_json

def init_bokeh(clientdoc):
    request.bokeh_server_document = clientdoc
    clientdoc.autostore = False
    clientdoc.autoadd = False

# Management Functions

@bokeh_app.route("/bokeh/bb/<docid>/reset", methods=['GET'])
@check_write_authentication_and_create_client
def reset(docid):
    ''' Reset a specified :class:`Document <bokeh.document.Document>`.

    Deletes all stored objects except for the current
    :class:`PlotContext <bokeh.models.PlotContext>`, which has all of
    its children removed.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to reset

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
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
    ''' Run the Bokeh Server garbage collector for a given
    :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to collect

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc, delete=True)
    return 'success'

@bokeh_app.route("/bokeh/bb/<docid>/callbacks", methods=['POST'])
@check_write_authentication_and_create_client
def callbacks_post(docid):
    ''' Update callbacks for a given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update callbacks for

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    # broken...
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    jsondata = protocol.deserialize_json(request.data.decode('utf-8'))
    bokeh_app.backbone_storage.push_callbacks(jsondata)
    return make_json(protocol.serialize_json(jsondata))

@bokeh_app.route("/bokeh/bb/<docid>/callbacks", methods=['GET'])
@check_write_authentication_and_create_client
def callbacks_get(docid):
    ''' Retrieve callbacks for a given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to get callbacks for

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    # broken...
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    jsondata = bokeh_app.backbone_storage.load_callbacks()
    return make_json(protocol.serialize_json(jsondata))

# bulk upsert
@bokeh_app.route("/bokeh/bb/<docid>/bulkupsert", methods=['POST'])
@check_write_authentication_and_create_client
def bulk_upsert(docid):
    ''' Update or insert new objects for a given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    # endpoint is only used by python, therefore we don't process
    # callbacks here
    client = request.headers.get('client', 'python')
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    data = protocol.deserialize_json(request.data.decode('utf-8'))
    if client == 'python':
        clientdoc.load(*data, events='none', dirty=True)
    else:
        clientdoc.load(*data, events='existing', dirty=True)
    changed = bokeh_app.backbone_storage.store_document(clientdoc)
    msg = ws_update(clientdoc, changed)
    return make_json(msg)

def ws_update(clientdoc, models):
    attrs = clientdoc.dump(*models)
    msg = protocol.serialize_json({'msgtype' : 'modelpush',
                                   'modelspecs' : attrs
                               })
    bokeh_app.publisher.send("bokehplot:" + clientdoc.docid, msg)
    return msg

def ws_delete(clientdoc, models):
    attrs = clientdoc.dump(*models)
    msg = {
        'msgtype'    : 'modeldel',
        'modelspecs' : attrs,
    }
    msg = protocol.serialize_json(msg)
    bokeh_app.wsmanager.send("bokehplot:" + clientdoc.docid, msg)
    return msg

# backbone functionality
@bokeh_app.route("/bokeh/bb/<docid>/<typename>/", methods=['POST'])
@check_write_authentication_and_create_client
def create(docid, typename):
    ''' Update or insert new objects for a given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    modeldata = protocol.deserialize_json(request.data.decode('utf-8'))
    modeldata = {'type' : typename,
                 'attributes' : modeldata}
    clientdoc.load(modeldata, dirty=True)
    bokeh_app.backbone_storage.store_document(clientdoc)
    ws_update(clientdoc, modeldata)
    return protocol.serialize_json(modeldata[0]['attributes'])

@check_read_authentication_and_create_client
def _bulkget(docid, typename=None):
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

@bokeh_app.route("/bokeh/bb/<docid>/", methods=['GET'])
def bulkget_without_typename(docid):
    ''' Retrieve all objects for a given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    return _bulkget(docid)

@bokeh_app.route("/bokeh/bb/<docid>/<typename>/", methods=['GET'])
def bulkget_with_typename(docid):
    ''' Retrieve all objects of a specified typename for a
    given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into
    :param typename: the type of objects to find and return

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    return _bulkget(docid, typename)

@crossdomain(origin="*", methods=['PATCH', 'GET', 'PUT'], headers=['BOKEH-API-KEY', 'Continuum-Clientid', 'Content-Type'])
def _handle_specific_model(docid, typename, id, method):
    if method == 'PUT':
        return update(docid, typename, id)
    elif method == 'PATCH':
        return update(docid, typename, id)
    elif method == 'GET':
        return getbyid(docid, typename, id)
    elif method == 'DELETE':
        return delete(docid, typename, id)

# route for working with individual models
@bokeh_app.route("/bokeh/bb/<docid>/<typename>/<id>/", methods=['GET', 'OPTIONS'])
def _handle_specific_model_get(docid, typename, id):
    ''' Retrieve a specific model with a given id and typename for a
    given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into
    :param typename: the type of objects to find and return
    :param id: unique id of the object to retrieve

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    return _handle_specific_model(docid, typename, id, request.method)

@bokeh_app.route("/bokeh/bb/<docid>/<typename>/<id>/", methods=['PUT'])
def _handle_specific_model_put(docid, typename, id):
    ''' Update a specific model with a given id and typename for a
    given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into
    :param typename: the type of objects to find and return
    :param id: unique id of the object to retrieve

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    return _handle_specific_model(docid, typename, id, request.method)

@bokeh_app.route("/bokeh/bb/<docid>/<typename>/<id>/", methods=['PATCH'])
def _handle_specific_model_patch(docid, typename, id):
    ''' Update a specific model with a given id and typename for a
    given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into
    :param typename: the type of objects to find and return
    :param id: unique id of the object to retrieve

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    return _handle_specific_model(docid, typename, id, request.method)

@bokeh_app.route("/bokeh/bb/<docid>/<typename>/<id>/", methods=['DELETE'])
def _handle_specific_model_delete(docid, typename, id):
    ''' Delete a specific model with a given id and typename for a
    given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into
    :param typename: the type of objects to find and return
    :param id: unique id of the object to retrieve

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    return _handle_specific_model(docid, typename, id, request.method)


# individual model methods
@check_read_authentication_and_create_client
def getbyid(docid, typename, id):
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
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    log.info("loading done %s", len(clientdoc._models.values()))
    prune(clientdoc)
    init_bokeh(clientdoc)
    log.info("updating")
    modeldata = protocol.deserialize_json(request.data.decode('utf-8'))
    ### horrible hack, we need to pop off the noop object if it exists
    modeldata.pop('noop', None)
    # patch id is not passed...
    modeldata['id'] = id
    modeldata = {'type' : typename,
                 'attributes' : modeldata}

    clientdoc.load(modeldata, events='existing', dirty=True)
    log.info("done")
    log.info("saving")
    changed = bokeh_app.backbone_storage.store_document(clientdoc)
    log.debug("changed, %s", str(changed))
    ws_update(clientdoc, changed)
    log.debug("update, %s, %s", docid, typename)
    # backbone expects us to send back attrs of this model, but it doesn't
    # make sense to do so because we modify other models, and we want this to
    # all go out over the websocket channel
    return make_json(protocol.serialize_json({'noop' : True}))

@check_write_authentication_and_create_client
def delete(docid, typename, id):
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    model = clientdoc._models[id]
    clientdoc.del_obj(docid, model)
    ws_delete(clientdoc, [model])
    return make_json(protocol.serialize_json(clientdoc.dump(model)[0]['attributes']))
