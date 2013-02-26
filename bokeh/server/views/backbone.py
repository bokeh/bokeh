from flask import (
        render_template, request, current_app,
        send_from_directory, make_response)
import flask
import os
import logging
import uuid
import urlparse
from ..app import app
from ..serverbb import make_model
from .. import wsmanager
from ..models import convenience
from ..models import docs
from bbauth import (check_read_authentication_and_create_client,
                    check_write_authentication_and_create_client)
log = logging.getLogger(__name__)

#backbone model apis
@app.route("/bokeh/bb/<docid>/reset", methods=['GET'])
@check_write_authentication_and_create_client
def reset(docid):
    models = current_app.collections.get_bulk(docid)
    for m in models:
        if not m.typename.endswith('PlotContext'):
            current_app.collections.delete(m.typename, m.id)
        else:
            m.set('children', [])
            current_app.collections.add(m)
    return 'success'

#backbone model apis
@app.route("/bokeh/bb/<docid>/rungc", methods=['GET'])
@check_write_authentication_and_create_client
def rungc(docid):
    all_models = docs.prune_and_get_valid_models(current_app.model_redis,
                                                 current_app.collections,
                                                 docid, delete=True)
    return 'success'

@app.route("/bokeh/bb/<docid>/bulkupsert", methods=['POST'])
@check_write_authentication_and_create_client
def bulk_upsert(docid):
    data = current_app.ph.deserialize_web(request.data)
    models = [make_model(x['type'], **x['attributes']) \
              for x in data]
    for m in models:
        if m.get('docs') is None:
            m.set('docs', [docid])
        m.set('created', True)
        current_app.collections.add(m)
    docs = set()
    for m in models:
        docs.update(m.get('docs'))
    clientid = request.headers.get('Continuum-Clientid', None)
    for doc in docs:
        relevant_models = [x for x in models if doc in x.get('docs')]
        current_app.wsmanager.send("bokehplot:" + doc, app.ph.serialize_web(
            {'msgtype' : 'modelpush',
             'modelspecs' : [x.to_broadcast_json() for x in relevant_models]}),
            exclude={clientid})
    return app.ph.serialize_web(
        {'msgtype' : 'modelpush',
         'modelspecs' : [x.to_broadcast_json() for x in relevant_models]})

@app.route("/bokeh/bb/<docid>/<typename>", methods=['POST'])
@app.route("/bokeh/bb/<docid>/<typename>/", methods=['POST'])
@check_write_authentication_and_create_client
def create(docid, typename):
    modeldata = current_app.ph.deserialize_web(request.data)
    model = make_model(typename, **modeldata)
    if model.get('docs') is None:
        model.set('docs', [docid])
    model.set('created', True)
    current_app.collections.add(model)
    if model.typename == 'ObjectArrayDataSource':
        print current_app.collections.get(model.typename, model.id)
        print current_app.collections.get(model.typename, model.id).id
    clientid=request.headers.get('Continuum-Clientid', None)
    for doc in model.get('docs'):
        current_app.wsmanager.send("bokehplot:" + doc, app.ph.serialize_web(
            {'msgtype' : 'modelpush',
             'modelspecs' : [model.to_broadcast_json()]}),
            exclude={clientid})
    return app.ph.serialize_web(model.to_json())

@app.route("/bokeh/bb/<docid>/<typename>/<id>", methods=['PATCH'])
@check_write_authentication_and_create_client
def patch(docid, typename, id):
    modeldata = current_app.ph.deserialize_web(request.data)
    modeldata['id'] = id
    model = current_app.collections.attrupdate(typename, modeldata)
    log.debug("patch, %s, %s", docid, typename)
    if model.get('docs') is None:
        model.set('docs', [docid])
    current_app.collections.add(model)
    clientid=request.headers.get('Continuum-Clientid', None)
    for doc in model.get('docs'):
        current_app.wsmanager.send("bokehplot:" + doc, app.ph.serialize_web(
            {'msgtype' : 'modelpush',
             'modelspecs' : [model.to_broadcast_json()]}),
                                   exclude={clientid})
    return (app.ph.serialize_web(model.to_json()), "200",
            {"Access-Control-Allow-Origin": "*"})
    

@app.route("/bokeh/bb/<docid>/<typename>/<id>", methods=['PUT'])
@check_write_authentication_and_create_client
def put(docid, typename, id):
    modeldata = current_app.ph.deserialize_web(request.data)
    log.debug("put, %s, %s", docid, typename)
    model = make_model(typename, **modeldata)
    if model.get('docs') is None:
        model.set('docs', [docid])
    current_app.collections.add(model)
    clientid=request.headers.get('Continuum-Clientid', None)
    for doc in model.get('docs'):
        current_app.wsmanager.send("bokehplot:" + doc, app.ph.serialize_web(
            {'msgtype' : 'modelpush',
             'modelspecs' : [model.to_broadcast_json()]}),
                                   exclude={clientid})
    return (app.ph.serialize_web(model.to_json()), "200",
            {"Access-Control-Allow-Origin": "*"})

@app.route("/bokeh/bb/<docid>/", methods=['GET'])
@app.route("/bokeh/bb/<docid>/<typename>/", methods=['GET'])
@app.route("/bokeh/bb/<docid>/<typename>/<id>", methods=['GET'])
@check_read_authentication_and_create_client
def get(docid, typename=None, id=None):
    include_hidden = request.values.get('include_hidden', '').lower() == 'true'
    if typename is not None and id is not None:
        model = current_app.collections.get(typename, id)
        if model is not None and docid in model.get('docs'):
            return app.ph.serialize_web(model.to_json(
                include_hidden=include_hidden))
        return app.ph.serialize_web(None)
    else:
        models = current_app.collections.get_bulk(docid, typename=typename)
        if typename is not None:
            return app.ph.serialize_web(
                [x.to_json(include_hidden=include_hidden) for x in models]
                )
        else:
            return app.ph.serialize_web(
                [x.to_broadcast_json(include_hidden=include_hidden) \
                 for x in models]
                )

@app.route("/bokeh/bb/<docid>/<typename>/<id>", methods=['DELETE'])
@check_write_authentication_and_create_client
def delete(docid, typename, id):
    model = current_app.collections.get(typename, id)
    log.debug("DELETE, %s, %s", docid, typename)
    clientid = request.headers.get('Continuum-Clientid', None)
    if docid in model.get('docs'):
        current_app.collections.delete(typename, id)
        for doc in model.get('docs'):
            current_app.wsmanager.send("bokehplot:" + doc, app.ph.serialize_web(
                {'msgtype' : 'modeldel',
                 'modelspecs' : [model.to_broadcast_json()]}),
                                       exclude={clientid})
        return app.ph.serialize_web(model.to_json())
    else:
        return "INVALID"
