from __future__ import print_function

from numpy import pi, arange, sin, cos
import numpy as np
import os.path

from bokeh.objects import (Plot, DataRange1d, LinearAxis,
    ColumnDataSource, Glyph, PanTool, WheelZoomTool,
    PreviewSaveTool, ObjectExplorerTool)
from bokeh.glyphs import Line
from bokeh import session

x = np.linspace(-2*pi, 2*pi, 1000)
y = sin(x)
z = cos(x)

source = ColumnDataSource(
    data=dict(
        x=x,
        y=y,
    )
)

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
wheelzoomtool = WheelZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))
previewsave = PreviewSaveTool(plot=plot)
objectexplorer = ObjectExplorerTool()

plot.renderers.append(renderer)
plot.tools = [pantool, wheelzoomtool, previewsave, objectexplorer]

sess = session.HTMLFileSession("line.html")
sess.add(plot, recursive=True)
sess.plotcontext.children.append(plot)
sess.save()
print("Wrote %s" % sess.filename)

if __name__ == "__main__":
    sess.view()
