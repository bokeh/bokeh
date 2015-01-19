import json

import pandas as pd
import numpy as np
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

_span = ar_downsample._span

def _make_range(r):
    """Create a range from the start/end values passed.
       This function is required because some BokehJS Range objects
       have ids but some don't and some have docs but some don't...
       so this is sort of a #Hack....

       This may be removed when a better plot_state mechanism is created.
    """
    return Range1d(start=r['start'], end=r['end'])

@mbsbp.route("/render/<docid>/<datasourceid>/<glyphid>", methods=['POST'])
def render(docid, datasourceid, glyphid):
    #load bokeh document
    bokehuser = bokeh_app.authentication.current_user()
    request_username = bokehuser.username
    clientdoc = bokeh_app.backbone_storage.get_document(docid)
    prune(clientdoc)
    #

    #init plotting.py
    init_bokeh(clientdoc)

    serverdatasource = clientdoc._models[datasourceid]
    glyph = clientdoc._models[glyphid]
    parameters = serverdatasource.transform
    json_data = request.json
    json_data['expr'] = serverdatasource.expr
    json_data['namespace'] = serverdatasource.namespace
    plot_state = json_data['plot_state']
    render_state = json_data.get('render_state', None)

    #convert json objects into actual range objects (hacky!)
    plot_state=dict([(k, _make_range(r)) for k,r in iteritems(plot_state)])

    #compute blaze data using the blaze server blueprint
    expr, result = _compserver(json_data)

    #convert blaze server output into other dataframe or numpy
    data_type = parameters.get('type', 'DataFrame')
    if  data_type == 'DataFrame':
        data = into(pd.DataFrame, result)
    elif data_type == 'ndarray':
        data = into(np.ndarray, result)

    #call downsampling
    resample_op = serverdatasource.transform['resample']
    if resample_op == 'abstract rendering':
        result = ar_downsample.downsample(
            data,
            serverdatasource,
            glyph,
            plot_state,
            render_state)
    elif resample_op == 'line1d':
        result = line1d_downsample(
            data,
            serverdatasource,
            glyph,
            plot_state,
            render_state
        )
    elif resample_op == 'heatmap':
        pass

    #return results
    result = make_json(protocol.serialize_json(result))
    return result

def line1d_downsample(raw_data, data_source, glyph, plot_state, render_state):
    if data_source.transform.get('direction', 'x') == 'x':
        domain_r = plot_state['data_x']
        range_r = plot_state['data_y']
        domain_screen_r = plot_state['screen_x']
    else:
        raise NotImplementedError
    screen_d_span = float(_span(domain_screen_r))
    data_d_span = float(_span(domain_r))
    data_r_span = float(_span(range_r))
    domain_name = glyph.x['field']
    range_name = glyph.y['field']
    domain = raw_data[domain_name]
    if data_d_span == 0:
        domain_limit = [domain.min(), domain.max()]
    else:
        domain_limit = [domain_r.start, domain_r.end]
    if domain.dtype.kind == "M":
        domain_limit = np.array(domain_limit).astype('datetime64[ns]')
    raw_data = raw_data[(domain > domain_limit[0]) & (domain < domain_limit[1])]
    result = line_downsample.downsample(raw_data.to_records(),
                                        domain_name,
                                        range_name,
                                        domain_limit,
                                        data_r_span,
                                        screen_d_span,
                                        method='minmax')
    return result
