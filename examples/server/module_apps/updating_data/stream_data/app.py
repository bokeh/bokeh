"""Append data periodically while retaining the most recent 100 points."""

from math import sin

from bokeh.models import ColumnDataSource
from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI


def modify_document(doc):
    source = ColumnDataSource(data=dict(x=[0], y=[0.0]), name="signal")
    plot = figure(title="Streaming data", x_axis_label="Sample", y_axis_label="Value")
    plot.line("x", "y", source=source)

    def update():
        x = source.data["x"][-1] + 1
        source.stream(dict(x=[x], y=[sin(x / 10)]), rollover=100)

    doc.add_root(plot)
    doc.add_periodic_callback(update, 100)


app = BokehASGI(modify_document)
