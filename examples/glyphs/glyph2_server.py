from __future__ import print_function

from numpy import pi, arange, sin, cos

from bokeh.document import Document
from bokeh.glyphs import Circle
from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, Grid,
    ColumnDataSource, Glyph, PanTool, WheelZoomTool
)
from bokeh import session

document = Document()
session = session.Session()
session.use_doc('glyph2_server')
session.load_document(document)

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
r = (cos(x)+1) * 6 + 6

source = ColumnDataSource(data=dict(x=x, y=y, r=r))

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], min_border=80)

circle = Circle(
    x="x", y="y", size="r",
    fill_color="red", line_color="black"
)
plot.add_obj(Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=circle))

xaxis = LinearAxis()
plot.add_obj(xaxis, 'below')

yaxis = LinearAxis()
plot.add_obj(yaxis, 'left')

plot.add_obj(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_obj(Grid(dimension=1, ticker=yaxis.ticker))

pantool = PanTool(dimensions=["width", "height"])
wheelzoomtool = WheelZoomTool(dimensions=["width", "height"])
plot.tools = [pantool,wheelzoomtool]

document.add(plot)
session.store_document(document)

link = session.object_link(document._plotcontext)
print ("please visit %s to see plots" % link)


