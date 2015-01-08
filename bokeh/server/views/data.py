
import json

from flask import jsonify, request
from six import iteritems

from bokeh import protocol
from bokeh.models import Range1d

from .backbone import init_bokeh
from ..app import bokeh_app
from ..crossdomain import crossdomain
from ..serverbb import prune
from ..views import make_json

@bokeh_app.route("/bokeh/data/<username>", methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=['BOKEH-API-KEY', 'Continuum-Clientid'])
def list_sources(username):
    bokehuser = bokeh_app.authentication.current_user()
    request_username = bokehuser.username
    sources = bokeh_app.datamanager.list_data_sources(request_username,
                                                      username)
    return jsonify(sources=sources)


def _make_range(r):
    """Create a range from the start/end values passed.
       This function is required because some BokehJS Range objects
       have ids but some don't and some have docs but some don't...
       so this is sort of a #Hack....

       This may be removed when a better plot_state mechanism is created.
    """
    return Range1d(start=r['start'], end=r['end'])

@bokeh_app.route("/bokeh/data/<username>/<docid>/<datasourceid>", methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=['BOKEH-API-KEY', 'Continuum-Clientid'])
def get_data(username, docid, datasourceid):
    bokehuser = bokeh_app.authentication.current_user()
    request_username = bokehuser.username
    # handle docid later...
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    init_bokeh(clientdoc)
    serverdatasource = clientdoc._models[datasourceid]
    parameters = json.loads(request.values.get('resample_parameters'))
    plot_state = json.loads(request.values.get('plot_state'))
    render_state = json.loads(request.values.get('render_state')) if 'render_state' in request.values else None

    # TODO: Desserializing directly to ranges....awk-ward.
    # There is probably a better way via the properties system that detects type...probably...
    # Possibly pass the whole plot_view object through instead of just the fragments we get with this mechanism

    plot_state=dict([(k, _make_range(r)) for k,r in iteritems(plot_state)])

    result = bokeh_app.datamanager.get_data(
            request_username,
            serverdatasource,
            parameters,
            plot_state,
            render_state)

    json_result = make_json(protocol.serialize_json(result))
    return json_result 

@bokeh_app.route("/bokeh/data/upload/<username>/<name>", methods=['POST'])
def upload(username, name):
    bokehuser = bokeh_app.authentication.current_user()
    request_username = bokehuser.username
    f = request.files['file']
    url = bokeh_app.datamanager.write(request_username, name, f)
    return url
