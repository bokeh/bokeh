from __future__ import print_function

from numpy import pi, arange, sin, cos

from bokeh.client import push_session
from bokeh.document import Document
from bokeh.models.glyphs import Circle
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, Grid,
    ColumnDataSource, PanTool, WheelZoomTool
)

document = Document()
session = push_session(document)

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
r = (cos(x)+1) * 6 + 6

source = ColumnDataSource(data=dict(x=x, y=y, r=r))

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(x_range=xdr, y_range=ydr, min_border=80)

circle = Circle(
    x="x", y="y", size="r",
    fill_color="red", line_color="black"
)
plot.add_glyph(source, circle)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

plot.add_tools(PanTool(), WheelZoomTool())

document.add_root(plot)
document.validate()
session.show(plot)
