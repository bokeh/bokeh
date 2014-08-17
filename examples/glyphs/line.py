from __future__ import print_function

from numpy import pi, sin, cos
import numpy as np

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.glyphs import Line
from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource, Glyph,
    PanTool, WheelZoomTool, PreviewSaveTool, ObjectExplorerTool
)
from bokeh.resources import INLINE

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

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], min_border=50)
xaxis = LinearAxis(plot=plot)
plot.below.append(xaxis)
yaxis = LinearAxis(plot=plot)
plot.left.append(yaxis)

pantool = PanTool(dimensions=["width", "height"])
wheelzoomtool = WheelZoomTool(dimensions=["width", "height"])
previewsave = PreviewSaveTool(plot=plot)
objectexplorer = ObjectExplorerTool()

plot.renderers.append(renderer)
plot.tools = [pantool, wheelzoomtool, previewsave, objectexplorer]

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "line.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Line Glyph Example"))
    print("Wrote %s" % filename)
    view(filename)
