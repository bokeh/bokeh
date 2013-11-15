
from numpy import pi, arange, sin, cos
import numpy as np
import os.path
import time
from bokeh.objects import (Plot, DataRange1d, LinearAxis, 
        ObjectArrayDataSource, ColumnDataSource, Glyph,
        PanTool, ZoomTool)
from bokeh.glyphs import Line
from bokeh import session

x = np.linspace(-2*pi, 2*pi, 1000)
x_static = np.linspace(-2*pi, 2*pi, 1000)
y = sin(x)
z = cos(x)
widths = np.ones_like(x) * 0.02
heights = np.ones_like(x) * 0.2

source = ColumnDataSource(
    data=dict(x=x, y=y, z=z, x_static=x_static,
              widths=widths, heights=heights))

xdr = DataRange1d(sources=[source.columns("x")])
xdr_static = DataRange1d(sources=[source.columns("x_static")])
ydr = DataRange1d(sources=[source.columns("y")])

line_glyph = Line(x="x", y="y", line_color="blue")
line_glyph2 = Line(x="x", y="z", line_color="red")
renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = line_glyph
        )
renderer2 = Glyph(
        data_source = source,
        xdata_range = xdr_static,
        ydata_range = ydr,
        glyph = line_glyph2
        )

plot = Plot(x_range=xdr_static, y_range=ydr, data_sources=[source], 
        border=50)
xaxis = LinearAxis(plot=plot, dimension=0, location="bottom")
yaxis = LinearAxis(plot=plot, dimension=1, location="left")

pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
zoomtool = ZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot.renderers.append(renderer)
plot.renderers.append(renderer2)
plot.tools = [pantool, zoomtool]

sess = session.PlotServerSession(
    username="defaultuser",
    serverloc="http://localhost:5006", userapikey="nokey")
sess.use_doc("line_animate")
sess.add(plot, renderer, renderer2, xaxis, yaxis, 
         source, xdr, ydr, xdr_static, pantool, zoomtool)
sess.plotcontext.children.append(plot)
sess.plotcontext._dirty = True
# not so nice.. but set the model doens't know
# that we appended to children
sess.store_all()

print "Stored to document line_animate at http://localhost:5006/bokeh"

while True:
    for i in  np.linspace(-2*pi, 2*pi, 50):
        source._data['x'] = x +i
        source._dirty = True
        sess.store_all()
        time.sleep(0.05)



