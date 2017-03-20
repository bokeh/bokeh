import numpy as np

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import ColumnDataSource, CustomJSTransform
from bokeh.plotting import figure
from bokeh.resources import INLINE
from bokeh.sampledata.stocks import AAPL, GOOG
from bokeh.util.browser import view

def datetime(x):
    return np.array(x, dtype=np.datetime64)

plot = figure(x_axis_type="datetime", title="Normalized Stock Closing Prices")
plot.grid.grid_line_alpha=0.3
plot.xaxis.axis_label = 'Date'
plot.yaxis.axis_label = 'Normalized Closing Price'

aapl_source = ColumnDataSource(data=dict(
    aapl_date=datetime(AAPL['date']),
    aapl_close=AAPL['adj_close'],
))

goog_source = ColumnDataSource(data=dict(
    goog_date=datetime(GOOG['date']),
    goog_close=GOOG['adj_close'],
))

v_func = """\
    var last = xs[xs.length - 1]
    var norm = new Float64Array(xs.length)
    for (i = 0; i < xs.length; i++) {
        norm[i] = xs[i] / last
    }
    return norm
"""
normalize = CustomJSTransform(func="", v_func=v_func)

plot.line(x='aapl_date', y={'field': 'aapl_close', 'transform': normalize},
        color='red', legend="Apple", source=aapl_source)
plot.line(x='goog_date', y={'field': 'goog_close', 'transform': normalize},
        color='blue', legend="Google", source=goog_source)
plot.legend.location='top_left'

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "customjs_transform.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "CustomJSTransform Example"))
    print("Wrote %s" % filename)
    view(filename)
