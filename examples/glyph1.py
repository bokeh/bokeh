
from numpy import pi, arange, sin, cos
import numpy as np
import os.path

#from bokeh.glyphs import Rects, Square, Circles
from bokeh.objects import (Plot, DataRange1d, LinearAxis, 
        ColumnDataSource, GlyphRenderer, Circle)
from bokeh import session

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
z = cos(x)
widths = np.ones_like(x) * 0.02
heights = np.ones_like(x) * 0.2


source = ColumnDataSource(data=dict(x=x,y=y,z=z,widths=widths,
            heights=heights))

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

circle = Circle(x="x", y="y", fill="red", radius=0.5)

glyph_renderer = GlyphRenderer(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyphs = [circle]
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source])
xaxis = LinearAxis(orientation="bottom", data_range=xdr)
yaxis = LinearAxis(orientation="left", data_range=ydr)

plot.axes = [xaxis, yaxis]
plot.renderers = [glyph_renderer]

sess = session.HTMLFileSession("glyph1.html")
sess.server_static_dir="../bokeh/server"
sess.add(plot, glyph_renderer, xaxis, yaxis, source, xdr, ydr)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))

