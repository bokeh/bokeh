from __future__ import print_function

import sys
import time
import os.path
import requests

from numpy import pi, arange, sin, cos
import numpy as np

from bokeh.objects import (Plot, DataRange1d, LinearAxis,
    ColumnDataSource, Glyph, PanTool, WheelZoomTool)
from bokeh.glyphs import Line
from bokeh import session

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

plot = Plot(x_range=xdr_static, y_range=ydr, data_sources=[source],
        border=50)
xaxis = LinearAxis(plot=plot, dimension=0, location="bottom")
yaxis = LinearAxis(plot=plot, dimension=1, location="left")

pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
wheelzoomtool = WheelZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot.renderers.append(renderer)
plot.renderers.append(renderer2)
plot.tools = [pantool, wheelzoomtool]

try:
    sess = session.PlotServerSession(
        serverloc="http://localhost:5006",
        username="defaultuser",
        userapikey="nokey")
except requests.exceptions.ConnectionError:
    print("ERROR: This example requires the plot server. Please make sure plot server is running, by executing 'bokeh-server'")
    sys.exit(1)

sess.use_doc("line_animate")
sess.add(plot, recursive=True)
sess.plotcontext.children.append(plot)
sess.plotcontext._dirty = True
# not so nice.. but set the model doens't know
# that we appended to children
sess.store_all()

print("Stored to document line_animate at http://localhost:5006/bokeh")

while True:
    for i in  np.linspace(-2*pi, 2*pi, 50):
        source._data['x'] = x +i
        source._dirty = True
        sess.store_all()
        time.sleep(0.05)
