import numpy as np

from bokeh.models import ColumnDataSource, CustomJSTransform
from bokeh.plotting import figure
from bokeh.io import output_file, show
from bokeh.sampledata.stocks import AAPL, GOOG

def datetime(x):
    return np.array(x, dtype=np.datetime64)

plot = figure(x_axis_type="datetime", title="Normalized Stock Closing Prices")
plot.grid.grid_line_alpha=0.3
plot.xaxis.axis_label = 'Date'
plot.yaxis.axis_label = 'Normalized Price'

aapl_source = ColumnDataSource(data=dict(
    aapl_date=datetime(AAPL['date']),
    aapl_close=AAPL['adj_close'],
))

goog_source = ColumnDataSource(data=dict(
    goog_date=datetime(GOOG['date']),
    goog_close=GOOG['adj_close'],
))

v_func = """\
    var first = xs[0]
    var norm = new Float64Array(xs.length)
    for (i = 0; i < xs.length; i++) {
        norm[i] = xs[i] / first
    }
    return norm
"""
normalize = CustomJSTransform(func="", v_func=v_func)

plot.line(x='aapl_date', y={'field': 'aapl_close', 'transform': normalize},
        color='red', legend="Apple", source=aapl_source)
plot.line(x='goog_date', y={'field': 'goog_close', 'transform': normalize},
        color='blue', legend="Google", source=goog_source)
plot.legend.location='top_left'

output_file("customjs_transform.html")
show(plot)
