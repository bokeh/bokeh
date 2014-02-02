from __future__ import print_function

import sys
import os.path
import requests

from numpy import pi, arange, sin, cos
import numpy as np

from bokeh.objects import (Plot, DataRange1d, Range1d, LinearAxis, Grid,
        ColumnDataSource, Glyph, PanTool,
        WheelZoomTool)
from bokeh.glyphs import Line
from bokeh import session

# The Line glyph needs arrays of arrays of X and Y, so use newaxis.
x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)

source = ColumnDataSource(
    data=dict(x=x, y=y)
)

#xdr = DataRange1d(sources=[source.columns("xs")])
#ydr = DataRange1d(sources=[source.columns("ys")])

xdr = Range1d(start=-2*pi, end=2*pi)
ydr = Range1d(start=-1, end=1)

line = Line(x="x", y="y", line_color="blue", line_width=2)
glyph_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = line)

pantool = PanTool(dataranges=[xdr, ydr], dimensions=("width","height"))
wheelzoomtool = WheelZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
        border= 80)
xaxis = LinearAxis(plot=plot, dimension=0)
yaxis = LinearAxis(plot=plot, dimension=1)
xgrid = Grid(plot=plot, dimension=0)
ygrid = Grid(plot=plot, dimension=1)

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,wheelzoomtool]

demo_name = "line2"
if len(sys.argv) > 1 and sys.argv[1] == "server":
    try:
        sess = session.PlotServerSession(
            serverloc="http://localhost:5006",
            username="defaultuser",
            userapikey="nokey")
    except requests.exceptions.ConnectionError:
        print("ERROR: This example requires the plot server. Please make sure plot server is running, by executing 'bokeh-server'")
        sys.exit(1)

    sess.use_doc(demo_name)
    sess.add(plot, recursive=True)
    sess.plotcontext.children.append(plot)
    sess.plotcontext._dirty = True
    sess.store_all()
    print("Stored to document", demo_name)
else:
    sess = session.HTMLFileSession(demo_name + ".html")
    sess.add(plot, recursive=True)
    sess.plotcontext.children.append(plot)
    sess.save(js="absolute", css="absolute")
    print("Wrote %s" % sess.filename)
