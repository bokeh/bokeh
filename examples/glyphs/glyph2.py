from __future__ import print_function

from numpy import pi, arange, sin, cos
import numpy as np
import os.path
import sys

from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, Grid,
    ColumnDataSource, Glyph,
    PanTool, WheelZoomTool)
from bokeh.glyphs import Circle
from bokeh import session

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
r = (cos(x)+1) * 6 + 6


source = ColumnDataSource(
    data=dict(
        x=x,
        y=y,
        r=r,
    )
)

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

circle = Circle(x="x", y="y", fill_color="red", radius="r", line_color="black")

glyph_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
        )


pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
wheelzoomtool = WheelZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
        border= 80)
xaxis = LinearAxis(plot=plot, dimension=0, location="min")
yaxis = LinearAxis(plot=plot, dimension=1, location="min")
xgrid = Grid(plot=plot, dimension=0)
ygrid = Grid(plot=plot, dimension=1)

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,wheelzoomtool]

import requests
try:
    sess = session.PlotServerSession(username="defaultuser",
            serverloc="http://localhost:5006", userapikey="nokey")
    sess.use_doc("glyph2")
except requests.exceptions.ConnectionError as e:
    print(e)
    print("\nThis example requires the plot server.  Please make sure plot server is running, by executing 'bokeh-server'\n")
    sys.exit()

sess.add(plot, glyph_renderer, xaxis, yaxis, xgrid, ygrid, source, xdr, ydr, pantool, wheelzoomtool)
sess.plotcontext.children.append(plot)
sess.plotcontext._dirty = True
# not so nice.. but set the model doens't know
# that we appended to children
sess.store_all()
import webbrowser
webbrowser.open("http://localhost:5006/bokeh")

