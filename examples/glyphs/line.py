
from numpy import pi, arange, sin, cos
import numpy as np
import os.path

from bokeh.objects import (Plot, DataRange1d, LinearAxis, 
        ObjectArrayDataSource, ColumnDataSource, Glyph,
        PanTool, ZoomTool)
from bokeh.glyphs import Line
from bokeh import session

x = np.linspace(-2*pi, 2*pi, 1000)
y = sin(x)
z = cos(x)
widths = np.ones_like(x) * 0.02
heights = np.ones_like(x) * 0.2

source = ColumnDataSource(data=dict(x=x,y=y,z=z,widths=widths,
            heights=heights))

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

line_glyph = Line(x="x", y="y", line_color="blue")

renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = line_glyph
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], 
        border=50)
xaxis = LinearAxis(plot=plot, dimension=0, location="bottom")
yaxis = LinearAxis(plot=plot, dimension=1, location="left")

pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
zoomtool = ZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot.renderers.append(renderer)
plot.tools = [pantool, zoomtool]

sess = session.HTMLFileSession("line.html")
sess.add(plot, renderer, xaxis, yaxis, source, xdr, ydr, pantool, zoomtool)
sess.plotcontext.children.append(plot)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))
print "Wrote line.html"

try:
    import webbrowser
    webbrowser.open("file://" + os.path.abspath("line.html"))
except:
    pass

