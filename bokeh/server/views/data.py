from flask import jsonify, request
import json

from ..app import bokeh_app
from ..views import make_json
from ... import protocol



@bokeh_app.route("/bokeh/data/<username>", methods=['GET'])
def list_sources(username):
    bokehuser = bokeh_app.authentication.current_user()
    request_username = bokehuser.username
    sources = bokeh_app.datamanager.list_data_sources(request_username, 
                                                      username)
    return jsonify(sources=sources)

    
@bokeh_app.route("/bokeh/data2/<username>/<path:data_url>", methods=['GET'])
#@bokeh_app.route("/bokeh/data2/<username>", methods=['GET'])
def get_data(username, data_url):
    bokehuser = bokeh_app.authentication.current_user()
    request_username = bokehuser.username
    #handle docid later...
    downsample_function = request.values.get('downsample_function')
    downsample_parameters = request.values.get('downsample_parameters')
    downsample_parameters = json.loads(downsample_parameters)
    result = bokeh_app.datamanager.get_data(request_username, None, data_url,
                                            downsample_function, downsample_parameters)
    result = make_json(protocol.serialize_json(result))
    return result
    
