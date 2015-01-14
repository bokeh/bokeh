import json

import pandas as pd
from blaze import into
from flask import request
from six import iteritems

from ..app import bokeh_app
from ... import protocol
from ...transforms import line_downsample
from ...transforms import image_downsample
from ...transforms import ar_downsample
from ...models.ranges import Range1d
from ..serverbb import prune
from ..views.backbone import init_bokeh
from ..views import make_json

from mbs.views import _compserver
from mbs.app import mbsbp

def _make_range(r):
    """Create a range from the start/end values passed.
       This function is required because some BokehJS Range objects
       have ids but some don't and some have docs but some don't...
       so this is sort of a #Hack....

       This may be removed when a better plot_state mechanism is created.
    """
    return Range1d(start=r['start'], end=r['end'])

@mbsbp.route("/render/<docid>/<datasourceid>", methods=['POST'])
def render(docid, datasourceid):
    bokehuser = bokeh_app.authentication.current_user()
    request_username = bokehuser.username
    # handle docid later...
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    init_bokeh(clientdoc)
    serverdatasource = clientdoc._models[datasourceid]
    parameters = serverdatasource.transform
    json_data = request.json
    plot_state = json_data['plot_state']
    render_state = json_data.get('render_state', None)
    plot_state=dict([(k, _make_range(r)) for k,r in iteritems(plot_state)])

    #compute blaze data
    expr, result = _compserver()
    data_type = parameters.get('type', 'DataFrame')
    if  data_type == 'DataFrame':
        data = into(pd.DataFrame, result)
    elif data_type == 'ndarray':
        data = into(np.ndarray, result)
    resample_op = serverdatasource.transform['resample']
    if resample_op == 'abstract rendering':
        result = ar_downsample.downsample(
            data, serverdatasource.transform,
            plot_state,
            render_state)
    elif resample_op == 'line1d':
        pass
    elif resample_op == 'heatmap':
        pass
    import pdb;pdb.set_trace()
    result = make_json(protocol.serialize_json(result))
    return result
