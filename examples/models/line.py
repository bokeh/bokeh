from __future__ import print_function

from numpy import pi, sin, cos
import numpy as np

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Line
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource,
    PanTool, WheelZoomTool, SaveTool
)
from bokeh.resources import INLINE

x = np.linspace(-2*pi, 2*pi, 1000)
y = sin(x)
z = cos(x)

source = ColumnDataSource(data=dict(x=x, y=y))

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(x_range=xdr, y_range=ydr, min_border=50)

line_glyph = Line(x="x", y="y", line_color="blue")
plot.add_glyph(source, line_glyph)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

pan = PanTool()
wheel_zoom = WheelZoomTool()
preview_save = SaveTool()

plot.add_tools(pan, wheel_zoom, preview_save)

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "line.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Line Glyph Example"))
    print("Wrote %s" % filename)
    view(filename)
