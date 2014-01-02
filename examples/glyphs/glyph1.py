from __future__ import print_function

from numpy import pi, arange, sin, cos
import numpy as np
import os.path

from bokeh.objects import (Plot, DataRange1d, LinearAxis,
        ColumnDataSource, Glyph, ObjectArrayDataSource,
        PanTool, WheelZoomTool)
from bokeh.glyphs import Circle
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
        {'x' : 1, 'y' : 5, 'z':3},
        {'x' : 2, 'y' : 4, 'z':3, 'radius':10},
        {'x' : 3, 'y' : 3, 'z':3},
        {'x' : 4, 'y' : 2, 'z':3},
        {'x' : 5, 'y' : 1, 'z':3},
        ])

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

circle = Circle(x="x", y="y", fill_color="red", radius=5, line_color="black")

glyph_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
        border= 80)
xaxis = LinearAxis(plot=plot, dimension=0, location="min")
yaxis = LinearAxis(plot=plot, dimension=1, location="min")

pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
wheelzoomtool = WheelZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,wheelzoomtool]

sess = session.HTMLFileSession("glyph1.html")
sess.add(plot, recursive=True)
sess.plotcontext.children.append(plot)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))
sess.dumpjson(file="glyph1.json")
print("Wrote %s" % sess.filename)

if __name__ == "__main__":
    sess.view()
