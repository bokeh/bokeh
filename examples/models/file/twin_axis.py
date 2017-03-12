from __future__ import print_function

from numpy import pi, arange, sin, linspace

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Circle
from bokeh.models import (
    Plot, LinearAxis, ColumnDataSource, Range1d, PanTool, WheelZoomTool
)
from bokeh.resources import INLINE

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
y2 = linspace(0, 100, len(y))

source = ColumnDataSource(
    data=dict(x=x, y=y, y2=y2)
)

plot = Plot(x_range=Range1d(start=-6.5, end=6.5), y_range=Range1d(start=-1.1, end=1.1), min_border=80)

plot.extra_y_ranges = {"foo": Range1d(start=0, end=100)}

circle = Circle(x="x", y="y", fill_color="red", size=5, line_color="black")
plot.add_glyph(source, circle)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')


circle2 = Circle(x="x", y="y2", fill_color="blue", size=5, line_color="black")
plot.add_glyph(source, circle2, y_range_name="foo")

plot.add_layout(LinearAxis(y_range_name="foo"), 'left')

plot.add_tools(PanTool(), WheelZoomTool())

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "twin_axis.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Twin Axis Plot"))
    print("Wrote %s" % filename)
    view(filename)
