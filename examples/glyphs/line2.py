from __future__ import print_function

import sys
import requests

from numpy import pi, arange, sin

from bokeh.objects import (
    Plot, Range1d, LinearAxis, Grid, ColumnDataSource, Glyph, PanTool, WheelZoomTool
)
from bokeh.glyphs import Line
from bokeh import session
from bokeh.plotting import *

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

pantool = PanTool(dimensions=["width", "height"])
wheelzoomtool = WheelZoomTool(dimensions=["width", "height"])

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], min_border=80)
xaxis = LinearAxis(plot=plot, dimension=0)
yaxis = LinearAxis(plot=plot, dimension=1)
xgrid = Grid(plot=plot, dimension=0, axis=xaxis)
ygrid = Grid(plot=plot, dimension=1, axis=yaxis)

plot.renderers.append(glyph_renderer)
plot.tools = [pantool, wheelzoomtool]

demo_name = "line2"
if len(sys.argv) > 1 and sys.argv[1] == "server":
    output_server(demo_name)
    curdoc().add(plot)
    cursession().push_dirty(curdoc())
    print("Stored to document", demo_name)
    show()
else:
    sess = session.HTMLFileSession(demo_name + ".html")
    sess.add_plot(plot)
    sess.save()
    print("Wrote %s" % sess.filename)
