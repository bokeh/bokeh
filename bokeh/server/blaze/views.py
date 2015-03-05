from __future__ import absolute_import

import datetime as dt

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

@mbsbp.route("/render/<docid>/<datasourceid>/<glyphid>", methods=['GET', 'POST'])
def render(docid, datasourceid, glyphid):
    #load bokeh document
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
    auto_bounds = json_data.get('auto_bounds', False)

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
            render_state,
            auto_bounds,
        )
    elif resample_op == 'line1d':
        result = line1d_downsample(
            data,
            serverdatasource,
            glyph,
            plot_state,
            render_state,
            auto_bounds,
        )
    elif resample_op == 'heatmap':
        result = heatmap_downsample(
            data,
            serverdatasource,
            glyph,
            plot_state,
            render_state,
            auto_bounds,
        )


    #return results
    result = make_json(protocol.serialize_json(result))
    return result

def convert_range_to_time(range_obj):
    #assume millis from javascript
    if isinstance(range_obj.start, int):
        range_obj.start = dt.datetime.fromtimestamp(range_obj.start / 1000.0)
    if isinstance(range_obj.end, int):
        range_obj.end = dt.datetime.fromtimestamp(range_obj.end / 1000.0)



def line1d_downsample(raw_data, data_source, glyph, plot_state,
                      render_state, auto_bounds):
    domain_name = glyph.x['field']
    range_name = glyph.y['field']
    domain_col = raw_data[domain_name]
    range_col = raw_data[range_name]

    if auto_bounds:
        plot_state['data_x'].start = domain_col.min()
        plot_state['data_x'].end = domain_col.max()
        plot_state['data_y'].start = range_col.min()
        plot_state['data_y'].end = range_col.max()
    if domain_col.dtype.kind == "M":
        convert_range_to_time(plot_state['data_x'])
    if range_col.dtype.kind == "M":
        convert_range_to_time(plot_state['data_y'])
    if data_source.transform.get('direction', 'x') == 'x':
        domain_r = plot_state['data_x']
        range_r = plot_state['data_y']
        domain_screen_r = plot_state['screen_x']
    else:
        raise NotImplementedError
    screen_d_span = _span(domain_screen_r)
    data_r_span = _span(range_r)
    domain_limit = [domain_r.start, domain_r.end]
    if domain_col.dtype.kind == "M":
        domain_limit = np.array(domain_limit).astype('datetime64[ms]')
    raw_data = raw_data[(domain_col > domain_limit[0]) & (domain_col < domain_limit[1])]
    result = line_downsample.downsample(raw_data.to_records(),
                                        domain_name,
                                        range_name,
                                        domain_limit,
                                        data_r_span,
                                        screen_d_span,
                                        'minmax')
    result['x_range'] = {'start': plot_state['data_x'].start,
                         'end': plot_state['data_x'].end}
    result['y_range'] = {'start': plot_state['data_y'].start,
                         'end': plot_state['data_y'].end}
    return result

def heatmap_downsample(raw_data, data_source, glyph, plot_state,
                       render_state, auto_bounds):
    
    screen_x_r = plot_state['screen_x']
    screen_y_r = plot_state['screen_x']
    x_resolution = float(_span(screen_x_r))
    y_resolution = float(_span(screen_y_r))

    global_x_range = data_source.transform['global_x_range']
    global_y_range = data_source.transform['global_y_range']
    
    image_x_axis = np.linspace(global_x_range[0],
                               global_x_range[1],
                               raw_data.shape[1])
    image_y_axis = np.linspace(global_y_range[0],
                               global_y_range[1],
                               raw_data.shape[0])
    result = image_downsample.downsample(
        raw_data, image_x_axis, image_y_axis,
        plot_state['data_x'], plot_state['data_y'], x_resolution,
        y_resolution)
    output = result
    return output
