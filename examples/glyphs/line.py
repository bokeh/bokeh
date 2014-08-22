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

source = ColumnDataSource(data=dict(x=x, y=y))

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], min_border=50)

line_glyph = Line(x="x", y="y", line_color="blue")
plot.add_obj(Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line_glyph))

plot.add_obj(LinearAxis(), 'below')
plot.add_obj(LinearAxis(), 'left')

pan = PanTool()
wheel_zoom = WheelZoomTool()
preview_save = PreviewSaveTool()
object_explorer = ObjectExplorerTool()

plot.add_tools(pan, wheel_zoom, preview_save, object_explorer)

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "line.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Line Glyph Example"))
    print("Wrote %s" % filename)
    view(filename)
