#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from bokeh import protocol
from flask import request, jsonify

from .bbauth import handle_auth_error
from ..app import bokeh_app
from ..crossdomain import crossdomain
from ..models import docs
from ..serverbb import get_temporary_docid, BokehServerTransaction
from ..views import make_json

def init_bokeh(clientdoc):
    request.bokeh_server_document = clientdoc
    clientdoc.autostore = False
    clientdoc.autoadd = False

@bokeh_app.route("/bokeh/bb/<docid>/gc", methods=['POST'])
@handle_auth_error
def gc(docid):
    # client = request.headers.get('client', 'python')  # todo: not used?
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    bokehuser = bokeh_app.current_user()
    temporary_docid = get_temporary_docid(request, docid)
    t = BokehServerTransaction(
        bokehuser, doc, 'rw', temporary_docid=temporary_docid
    )
    t.load(gc=True)
    t.save()
    return jsonify(status='success')

# bulk upsert
@bokeh_app.route("/bokeh/bb/<docid>/bulkupsert", methods=['POST'])
@handle_auth_error
def bulk_upsert(docid):
    ''' Update or insert new objects for a given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    client = request.headers.get('client', 'python')
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    bokehuser = bokeh_app.current_user()
    temporary_docid = get_temporary_docid(request, docid)
    t = BokehServerTransaction(
        bokehuser, doc, 'rw', temporary_docid=temporary_docid
    )
    t.load()
    clientdoc = t.clientdoc
    data = protocol.deserialize_json(request.data.decode('utf-8'))
    if client == 'python':
        clientdoc.load(*data, events='none', dirty=True)
    else:
        clientdoc.load(*data, events='existing', dirty=True)
    t.save()
    msg = ws_update(clientdoc, t.write_docid, t.changed)
    return make_json(msg)

def ws_update(clientdoc, docid, models):
    log.debug("sending wsupdate to %s", docid)
    attrs = clientdoc.dump(*models)
    msg = protocol.serialize_json({'msgtype' : 'modelpush',
                                   'modelspecs' : attrs
                               })
    bokeh_app.publisher.send("bokehplot:" + docid, msg)
    return msg

def ws_delete(clientdoc, docid, models):
    attrs = clientdoc.dump(*models)
    msg = {
        'msgtype'    : 'modeldel',
        'modelspecs' : attrs,
    }
    msg = protocol.serialize_json(msg)
    bokeh_app.wsmanager.send("bokehplot:" + docid, msg)
    return msg

# backbone functionality
@bokeh_app.route("/bokeh/bb/<docid>/<typename>/", methods=['POST'])
@handle_auth_error
def create(docid, typename):
    ''' Update or insert new objects for a given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    bokehuser = bokeh_app.current_user()
    temporary_docid = get_temporary_docid(request, docid)
    t = BokehServerTransaction(
        bokehuser, doc, 'rw', temporary_docid=temporary_docid
    )
    t.load()
    modeldata = protocol.deserialize_json(request.data.decode('utf-8'))
    modeldata = [{'type' : typename,
                  'attributes' : modeldata}]
    t.clientdoc.load(*modeldata, dirty=True)
    t.save()
    ws_update(t.clientdoc, t.write_docid, modeldata)
    return protocol.serialize_json(modeldata[0]['attributes'])

@handle_auth_error
def _bulkget(docid, typename=None):
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    bokehuser = bokeh_app.current_user()
    temporary_docid = get_temporary_docid(request, docid)
    t = BokehServerTransaction(
        bokehuser, doc, 'r', temporary_docid=temporary_docid
    )
    t.load()
    clientdoc = t.clientdoc
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
def bulkget_with_typename(docid, typename):
    ''' Retrieve all objects of a specified typename for a
    given :class:`Document <bokeh.document.Document>`.

    :param docid: id of the :class:`Document <bokeh.document.Document>`
        to update or insert into
    :param typename: the type of objects to find and return

    :status 200: when user is authorized
    :status 401: when user is not authorized

    '''
    return _bulkget(docid, typename)

@crossdomain(origin="*", methods=['PATCH', 'GET', 'PUT'], headers=None)
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
@handle_auth_error
def getbyid(docid, typename, id):
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    bokehuser = bokeh_app.current_user()
    temporary_docid = get_temporary_docid(request, docid)
    t = BokehServerTransaction(
        bokehuser, doc, 'r', temporary_docid=temporary_docid
    )
    t.load()
    clientdoc = t.clientdoc
    attr = clientdoc.dump(clientdoc._models[id])[0]['attributes']
    return make_json(protocol.serialize_json(attr))

@handle_auth_error
def update(docid, typename, id):
    """we need to distinguish between writing and patching models
    namely in writing, we shouldn't remove unspecified attrs
    (we currently don't handle this correctly)
    """
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    bokehuser = bokeh_app.current_user()
    temporary_docid = get_temporary_docid(request, docid)
    t = BokehServerTransaction(
        bokehuser, doc, 'rw', temporary_docid=temporary_docid
    )
    t.load()
    modeldata = protocol.deserialize_json(request.data.decode('utf-8'))
    ### horrible hack, we need to pop off the noop object if it exists
    modeldata.pop('noop', None)
    clientdoc = t.clientdoc
    log.info("loading done %s", len(clientdoc._models.values()))
    # patch id is not passed...
    modeldata['id'] = id
    modeldata = {'type' : typename,
                 'attributes' : modeldata}
    clientdoc.load(modeldata, events='existing', dirty=True)
    t.save()
    ws_update(clientdoc, t.write_docid, t.changed)
    # backbone expects us to send back attrs of this model, but it doesn't
    # make sense to do so because we modify other models, and we want this to
    # all go out over the websocket channel
    return make_json(protocol.serialize_json({'noop' : True}))

@handle_auth_error
def delete(docid, typename, id):
    #I don't think this works right now
    obj = 'No this does not work, because obj is not defined, should it be an arg?'
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    bokehuser = bokeh_app.current_user()
    temporary_docid = get_temporary_docid(request, docid)
    t = BokehServerTransaction(
        bokehuser, doc, 'rw', temporary_docid=temporary_docid
    )
    clientdoc = t.clientdoc
    model = clientdoc._models[id]
    bokeh_app.backbone_storage.del_obj(t.write_docid, obj)
    t.save()
    ws_delete(clientdoc, t.write_docid, [model])
    return make_json(protocol.serialize_json(clientdoc.dump(model)[0]['attributes']))
