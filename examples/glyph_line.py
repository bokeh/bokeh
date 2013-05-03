
from numpy import pi, arange, sin, cos
import numpy as np
import os.path

#from bokeh.glyphs import Rects, Square, Circles
from bokeh.objects import (Plot, DataRange1d, LinearAxis, 
        ObjectArrayDataSource, LineRenderer)
from bokeh import session

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
z = cos(x)
widths = np.ones_like(x) * 0.02
heights = np.ones_like(x) * 0.2


#source = ColumnDataSource(data=dict(x=x,y=y,z=z,widths=widths,
#            heights=heights))
source = ObjectArrayDataSource(
    data = [
        {'x' : 1, 'y' : 5, 'z':3, 'radius':10},
        {'x' : 2, 'y' : 4, 'z':3},
        {'x' : 3, 'y' : 3, 'z':3, 'color':"red"},
        {'x' : 4, 'y' : 2, 'z':3},
        {'x' : 5, 'y' : 1, 'z':3},
        ])

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

line_renderer = LineRenderer(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        color = "red",
        xfield = "x",
        yfield = "y",
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source])
xaxis = LinearAxis(orientation="bottom", data_range=xdr)
yaxis = LinearAxis(orientation="left", data_range=ydr)

plot.axes = [xaxis, yaxis]
plot.renderers = [line_renderer]

sess = session.HTMLFileSession("glyph_line.html")
sess.server_static_dir="../bokeh/server"
sess.add(plot, line_renderer, xaxis, yaxis, source, xdr, ydr)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))





