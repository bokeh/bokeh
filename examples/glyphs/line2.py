
from numpy import pi, arange, sin, cos
import numpy as np
import os.path

from bokeh.objects import (Plot, DataRange1d, Range1d, LinearAxis, Grid,
        ColumnDataSource, Glyph, ObjectArrayDataSource, PanTool,
        ZoomTool)
from bokeh.glyphs import Line
from bokeh import session

# The Line glyph needs arrays of arrays of X and Y, so use newaxis.
x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)

source = ColumnDataSource(data=dict(x=x, y=y))

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
zoomtool = ZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
        border= 80)
xaxis = LinearAxis(plot=plot, dimension=0)
yaxis = LinearAxis(plot=plot, dimension=1)
xgrid = Grid(plot=plot, dimension=0)
ygrid = Grid(plot=plot, dimension=1)

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,zoomtool]

import requests, sys
demo_name = "line"
if len(sys.argv) > 1 and sys.argv[1] == "server":
    try:
        sess = session.PlotServerSession(username="defaultuser",
                serverloc="http://localhost:5006", userapikey="nokey")
        sess.use_doc(demo_name)
    except requests.exceptions.ConnectionError as e:
        print e
        print "\nThe 'server' version of this example requires the plot server.  Please make sure plot server is running, by executing 'bokeh-server'.\n"
        sys.exit()

    sess.add(plot, glyph_renderer, xaxis, yaxis, xgrid, ygrid, source, xdr, ydr, pantool, zoomtool)
    sess.plotcontext.children.append(plot)
    sess.plotcontext._dirty = True
    sess.store_all()
    print "Stored to document", demo_name
else:
    filename = demo_name + ".html"
    sess = session.HTMLFileSession(filename)
    sess.add(plot, glyph_renderer, xaxis, yaxis, xgrid, ygrid, source, xdr, ydr, pantool, zoomtool)
    sess.plotcontext.children.append(plot)
    sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))
    print "Wrote", filename

