from __future__ import print_function

import sys
import requests

from numpy import pi, arange, sin, cos

from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, Grid,
    ColumnDataSource, Glyph,
    PanTool, WheelZoomTool)
from bokeh.glyphs import Circle
from bokeh import session
from bokeh import document

document = document.Document()
session = session.Session()
session.use_doc('glyph2_server')
session.load_document(document)

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

circle = Circle(x="x", y="y", fill_color="red", radius={"field": "r", "units": "screen"}, line_color="black")

glyph_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
        )


pantool = PanTool(dimensions=["width", "height"])
wheelzoomtool = WheelZoomTool(dimensions=["width", "height"])

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], min_border=80)
xaxis = LinearAxis(plot=plot)
plot.below.append(xaxis)
yaxis = LinearAxis(plot=plot)
plot.left.append(yaxis)
xgrid = Grid(plot=plot, dimension=0, ticker=xaxis.ticker)
ygrid = Grid(plot=plot, dimension=1, ticker=yaxis.ticker)

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,wheelzoomtool]
document.add(plot)
# not so nice.. but set the model doens't know
# that we appended to children
session.store_document(document)

link = session.object_link(document._plotcontext)
print ("please visit %s to see plots" % link)


