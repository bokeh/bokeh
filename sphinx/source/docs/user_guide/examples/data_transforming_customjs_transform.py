import numpy as np

from bokeh.models import ColumnDataSource, CustomJSTransform
from bokeh.plotting import figure
from bokeh.io import output_file, show
from bokeh.sampledata.stocks import AAPL, GOOG
from bokeh.transform import transform

def datetime(x):
    return np.array(x, dtype=np.datetime64)

plot = figure(x_axis_type="datetime", title="Normalized Stock Closing Prices",
              plot_width=800, plot_height=350)
plot.background_fill_color = "#f0f0f0"
plot.xgrid.grid_line_color = None
plot.ygrid.grid_line_color = "black"
plot.ygrid.grid_line_alpha = 0.1
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

v_func = """
    const first = xs[0]
    const norm = new Float64Array(xs.length)
    for (let i = 0; i < xs.length; i++) {
        norm[i] = xs[i] / first
    }
    return norm
"""
normalize = CustomJSTransform(v_func=v_func)

plot.line(x='aapl_date', y=transform('aapl_close', normalize), line_width=2,
        color='#cf3c4d', alpha=0.6,legend="Apple", source=aapl_source)
plot.line(x='goog_date', y=transform('goog_close', normalize), line_width=2,
        color='#2f7bce', alpha=0.6, legend="Google", source=goog_source)
plot.legend.location='top_left'

output_file("customjs_transform.html")
show(plot)
