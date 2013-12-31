from __future__ import print_function

import sys
import os.path
import requests

from numpy import pi, arange, sin, cos
import numpy as np

from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, Grid,
    ColumnDataSource, Glyph, ObjectArrayDataSource,
    PanTool, ZoomTool)
from bokeh.glyphs import Circle
from bokeh import session

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
z = (cos(x)+1) * 6 + 6
widths = np.ones_like(x) * 0.02
heights = np.ones_like(x) * 0.2


source = ColumnDataSource(data=dict(x=x,y=y,z=z,widths=widths,
            heights=heights))
#source = ObjectArrayDataSource(
#    data = [
#        {'x' : 1, 'y' : 5, 'z':3},
#        {'x' : 2, 'y' : 4, 'z':3, 'radius':10},
#        {'x' : 3, 'y' : 3, 'z':3, 'fill':"blue"},
#        {'x' : 4, 'y' : 2, 'z':3},
#        {'x' : 5, 'y' : 1, 'z':3},
#        ])

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

circle = Circle(x="x", y="y", fill_color="red", radius="z", line_color="black")

glyph_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
        )


pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
zoomtool = ZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
        border= 80)
xaxis = LinearAxis(plot=plot, dimension=0, location="min")
yaxis = LinearAxis(plot=plot, dimension=1, location="min")
xgrid = Grid(plot=plot, dimension=0)
ygrid = Grid(plot=plot, dimension=1)

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,zoomtool]

try:
    sess = session.PlotServerSession(
        serverloc="http://localhost:5006",
        username="defaultuser",
        userapikey="nokey")
except requests.exceptions.ConnectionError:
    print("ERROR: This example requires the plot server. Please make sure plot server is running, by executing 'bokeh-server'")
    sys.exit(1)

sess.use_doc("glyph2")
sess.add(plot, recursive=True)
sess.plotcontext.children.append(plot)
sess.plotcontext._dirty = True
# not so nice.. but set the model doens't know
# that we appended to children
sess.store_all()
import webbrowser
webbrowser.open("http://localhost:5006/bokeh")
