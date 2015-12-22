from __future__ import print_function

from numpy import pi, sin, cos
import numpy as np

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Line
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource,
    PanTool, WheelZoomTool, PreviewSaveTool, Legend,
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
line = plot.add_glyph(source, line_glyph)

plot.add_layout(LinearAxis(), 'above')
plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')
plot.add_layout(LinearAxis(), 'right')

pan = PanTool()
wheel_zoom = WheelZoomTool()
preview_save = PreviewSaveTool()

plot.add_tools(pan, wheel_zoom, preview_save)

from bokeh.core.enums import LegendLocation

for location in LegendLocation:
    legend = Legend(legends=[(location, [line])], location=location)
    plot.add_layout(legend)

legend = Legend(legends=[("x=100px, y=150px", [line])], location=(100, 150))
plot.add_layout(legend)

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    filename = "legends.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Legends Example"))
    print("Wrote %s" % filename)
    view(filename)
