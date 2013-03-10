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
from ..crossdomain import crossdomain
from ..views import make_json
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
        m.set('doc', docid)
        current_app.collections.add(m)
    clientid = request.headers.get('Continuum-Clientid', None)
    msg = app.ph.serialize_web({
        'msgtype' : 'modelpush',
        'modelspecs' : [x.to_broadcast_json() for x in models]
        })
    current_app.wsmanager.send("bokehplot:" + docid, msg,  exclude={clientid})
    return msg

@app.route("/bokeh/bb/<docid>/<typename>/", methods=['POST'])
@check_write_authentication_and_create_client
def create(docid, typename):
    modeldata = current_app.ph.deserialize_web(request.data)
    model = make_model(typename, **modeldata)
    model.set('doc', docid)
    current_app.collections.add(model)
    clientid=request.headers.get('Continuum-Clientid', None)
    msg = app.ph.serialize_web(
        {'msgtype' : 'modelpush',
         'modelspecs' : [model.to_broadcast_json()]
         })
    current_app.wsmanager.send("bokehplot:" + docid, msg, exclude={clientid})
    return app.ph.serialize_web(model.to_json())


@app.route("/bokeh/bb/<docid>/", methods=['GET'])
@app.route("/bokeh/bb/<docid>/<typename>/", methods=['GET'])
@check_read_authentication_and_create_client
def get(docid, typename=None):
    include_hidden = request.values.get('include_hidden', '').lower() == 'true'
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
@app.route("/bokeh/bb/<docid>/<typename>/<id>/", methods=['GET', 'OPTIONS', 'PUT','PATCH'])
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
    model = current_app.collections.get(typename, docid, id)
    if model:
        returnval = app.ph.serialize_web(
            model.to_json(include_hidden=include_hidden))
        return make_json(returnval,
                         headers={"Access-Control-Allow-Origin": "*"})
    if model is None:
        return app.ph.serialize_web(None)

@check_write_authentication_and_create_client
def patch(docid, typename, id):
    modeldata = current_app.ph.deserialize_web(request.data)
    modeldata['id'] = id
    modeldata['doc'] = docid
    model = current_app.collections.attrupdate(typename, docid, modeldata)
    log.debug("patch, %s, %s", docid, typename)
    current_app.collections.add(model)
    clientid=request.headers.get('Continuum-Clientid', None)
    msg = app.ph.serialize_web(
        {'msgtype' : 'modelpush',
         'modelspecs' : [model.to_broadcast_json()]}
        )
    current_app.wsmanager.send("bokehplot:" + docid, msg, exclude={clientid})
    return (app.ph.serialize_web(model.to_json()), "200",
            {"Access-Control-Allow-Origin": "*"})
    

@check_write_authentication_and_create_client
def put(docid, typename, id):
    modeldata = current_app.ph.deserialize_web(request.data)
    log.debug("put, %s, %s", docid, typename)
    model = make_model(typename, **modeldata)
    model.set('doc', docid)
    current_app.collections.add(model)
    clientid=request.headers.get('Continuum-Clientid', None)
    msg = app.ph.serialize_web(
        {'msgtype' : 'modelpush',
         'modelspecs' : [model.to_broadcast_json()]
         })
    current_app.wsmanager.send("bokehplot:" + docid, msg, exclude={clientid})
    return (app.ph.serialize_web(model.to_json()), "200",
            {"Access-Control-Allow-Origin": "*"})

@app.route("/bokeh/bb/<docid>/<typename>/<id>", methods=['DELETE'])
@check_write_authentication_and_create_client
def delete(docid, typename, id):
    model = current_app.collections.get(typename, docid, id)
    log.debug("DELETE, %s, %s", docid, typename)
    clientid = request.headers.get('Continuum-Clientid', None)
    current_app.collections.delete(typename, docid, id)
    msg = app.ph.serialize_web(
        {'msgtype' : 'modeldel',
         'modelspecs' : [model.to_broadcast_json()]
         })
    current_app.wsmanager.send("bokehplot:" + docid, msg, exclude={clientid})
    return app.ph.serialize_web(model.to_json())
