from __future__ import print_function

from numpy import pi, sin, cos
import numpy as np

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Line, Circle
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource,
    PanTool, WheelZoomTool, SaveTool, Legend
)
from bokeh.resources import INLINE

x = np.linspace(-2*pi, 2*pi, 400)
y = sin(x)
y2 = cos(x)

source = ColumnDataSource(data=dict(x=x, y=y, y2=y2))

xdr = DataRange1d()
ydr = DataRange1d()

HEIGHT = 400
plot = Plot(x_range=xdr, y_range=ydr, min_border=50, plot_width=1000, plot_height=HEIGHT)

line_glyph = Line(x="x", y="y", line_color="navy", line_width=2, line_dash="dashed")
line = plot.add_glyph(source, line_glyph)
circle = Circle(x="x", y="y2", size=6, line_color="red", fill_color="orange", fill_alpha=0.6)
circle = plot.add_glyph(source, circle)

pan = PanTool()
wheel_zoom = WheelZoomTool()
preview_save = SaveTool()

plot.add_tools(pan, wheel_zoom, preview_save)

# Add axes (Note it's important to add these before adding legends in side panels)
plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')
#plot.add_layout(LinearAxis(), 'right') - Due to a bug cannot have two things on the right side

from bokeh.core.enums import LegendLocation

# Add legends in names positions e.g. 'top_right', 'top_left' (see plot for all)
for location in LegendLocation:
    legend = Legend(items=[
        (location, [line]),
        ("other", [circle]),
    ], location=location, orientation="vertical")
    plot.add_layout(legend)

# Add legend at fixed positions
legend = Legend(items=[
    ("x: 300px, y: 150px (horizontal)", [line]),
    ("other", [circle]),
], location=(300, 150), orientation="horizontal")
plot.add_layout(legend)

# Add legend in side panels
legend = Legend(items=[
    ("x: 0px, y: 0px (horizontal | above panel)", [line]),
    ("other", [circle]),
], location=(0, 0), orientation="horizontal")
plot.add_layout(legend, 'above')

legend = Legend(items=[
    ("x: 0px, y: 0px (horizontal | below panel)", [line]),
    ("other", [circle]),
], location=(0, 0), orientation="horizontal")
plot.add_layout(legend, 'below')

legend = Legend(items=[
    ("x: 0px, y: 0px (vertical | left)", [line]),
    ("other", [circle]),
], location=(0, -HEIGHT/2), orientation="vertical")
plot.add_layout(legend, 'left')

legend = Legend(items=[
    ("x: 0px, y: 0px (vertical | right)", [line]),
    ("other", [circle]),
], location=(0, -HEIGHT/2), orientation="vertical")
plot.add_layout(legend, 'right')

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "legends.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Legends Example"))
    print("Wrote %s" % filename)
    view(filename)
