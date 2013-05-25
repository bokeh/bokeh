
from numpy import pi, arange, sin, cos
import numpy as np
import os.path

from bokeh.objects import ( Plot, DataRange1d, LinearAxis, Rule,
        ColumnDataSource, GlyphRenderer, ObjectArrayDataSource, PanTool,
        ZoomTool)
from bokeh.glyphs import Line
from bokeh import session

# The Line glyph needs arrays of arrays of X and Y, so use newaxis.
x = arange(-2*pi, 2*pi, 0.1)[np.newaxis,:]
y = sin(x)

source = ColumnDataSource(data=dict(xs=x, ys=y))

xdr = DataRange1d(sources=[source.columns("xs")])
ydr = DataRange1d(sources=[source.columns("ys")])

line = Line(xs="xs", ys="ys", line_color="blue", line_width=2)
glyph_renderer = GlyphRenderer(
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
xgrid = Rule(plot=plot, dimension=0)
ygrid = Rule(plot=plot, dimension=1)

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,zoomtool]

import sys
demo_name = "line"
if len(sys.argv) > 1 and sys.argv[1] == "server":
    sess = session.PlotServerSession(username="defaultuser",
            serverloc="http://localhost:5006", userapikey="nokey")
    sess.use_doc(demo_name)
    sess.add(plot, glyph_renderer, xaxis, yaxis, xgrid, ygrid, source, xdr, ydr, pantool, zoomtool)
    sess.store_all()
    print "Stored to document", demo_name
else:
    filename = demo_name + ".html"
    sess = session.HTMLFileSession(filename)
    sess.server_static_dir="../bokeh/server"
    sess.add(plot, glyph_renderer, xaxis, yaxis, xgrid, ygrid, source, xdr, ydr, pantool, zoomtool)
    sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))
    print "Wrote", filename

