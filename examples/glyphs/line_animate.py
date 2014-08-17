from __future__ import print_function

import sys
import time
import requests

from numpy import pi, sin, cos
import numpy as np

from bokeh.objects import (Plot, DataRange1d, LinearAxis,
    ColumnDataSource, Glyph, PanTool, WheelZoomTool)
from bokeh.glyphs import Line

from bokeh import session
from bokeh import document

document = document.Document()
session = session.Session()
session.use_doc('line_animate')
session.load_document(document)


x = np.linspace(-2*pi, 2*pi, 1000)
x_static = np.linspace(-2*pi, 2*pi, 1000)
y = sin(x)
z = cos(x)

source = ColumnDataSource(
    data=dict(
        x=x, y=y, z=z, x_static=x_static)
)

xdr = DataRange1d(sources=[source.columns("x")])
xdr_static = DataRange1d(sources=[source.columns("x_static")])
ydr = DataRange1d(sources=[source.columns("y")])

line_glyph = Line(x="x", y="y", line_color="blue")
line_glyph2 = Line(x="x", y="z", line_color="red")
renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = line_glyph
        )
renderer2 = Glyph(
        data_source = source,
        xdata_range = xdr_static,
        ydata_range = ydr,
        glyph = line_glyph2
        )

plot = Plot(x_range=xdr_static, y_range=ydr, data_sources=[source], min_border=50)
xaxis = LinearAxis(plot=plot)
plot.below.append(xaxis)
yaxis = LinearAxis(plot=plot)
plot.left.append(yaxis)

pantool = PanTool(dimensions=["width", "height"])
wheelzoomtool = WheelZoomTool(dimensions=["width", "height"])

plot.renderers.append(renderer)
plot.renderers.append(renderer2)
plot.tools = [pantool, wheelzoomtool]
document.add(plot)
session.store_document(document)
link = session.object_link(document._plotcontext)
print ("please visit %s to see plots" % link)
print ("animating")

while True:
    for i in  np.linspace(-2*pi, 2*pi, 50):
        source.data['x'] = x +i
        session.store_objects(source)
        time.sleep(0.05)
