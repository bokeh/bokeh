from __future__ import print_function

from numpy import pi, sin, cos, linspace

from bokeh.driving import count
from bokeh.io import curdoc
from bokeh.models import (
    Plot, DataRange1d, LinearAxis,
    ColumnDataSource, PanTool, WheelZoomTool, Line
)

source = ColumnDataSource(data=dict(x=[], y=[], z=[]))

plot = Plot(x_range=DataRange1d(), y_range=DataRange1d(), min_border=50)

line_glyph = Line(x="x", y="y", line_color="blue")
plot.add_glyph(source, line_glyph)

line_glyph2 = Line(x="x", y="z", line_color="red")
plot.add_glyph(source, line_glyph2)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

plot.add_tools(PanTool(), WheelZoomTool())

@count()
def update(t):
    x = linspace(-4*pi, 4*pi, 1000)
    y = sin(x + t * 0.1)
    z = cos(x + t * 0.1)
    source.data = dict(x=x, y=y, z=z)

# Manually call ``update`` so that plot is initialized with data
update(0)

doc = curdoc()
doc.add_root(plot)
doc.add_periodic_callback(update, 100)
