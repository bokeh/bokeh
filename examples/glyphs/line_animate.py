from __future__ import print_function

import time

from numpy import pi, sin, cos, linspace

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.models.glyphs import Line
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, Range1d,
    ColumnDataSource, PanTool, WheelZoomTool
)
from bokeh.client import push_session

document = Document()
session = push_session(document)

x = linspace(-6*pi, 6*pi, 1000)
y = sin(x)
z = cos(x)

source = ColumnDataSource(data=dict(x=x, y=y, z=z))

plot = Plot(x_range=Range1d(-2*pi, 2*pi), y_range=DataRange1d(), min_border=50)

line_glyph = Line(x="x", y="y", line_color="blue")
plot.add_glyph(source, line_glyph)

line_glyph2 = Line(x="x", y="z", line_color="red")
plot.add_glyph(source, line_glyph2)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

plot.add_tools(PanTool(), WheelZoomTool())

document.add(plot)
print("\nanimating... press ctrl-C to stop")
session.show(plot)

while True:
    for i in linspace(-2*pi, 2*pi, 50):
        source.data['x'] = x + i
        time.sleep(0.1)
