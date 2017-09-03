from __future__ import print_function

from numpy import pi, sin, cos
import numpy as np

from bokeh.io import show, output_file
from bokeh.models.glyphs import Line, Circle
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource,
    PanTool, WheelZoomTool, SaveTool, Legend,
)
from bokeh.core.enums import LegendLocation

x = np.linspace(-2*pi, 2*pi, 400)
y = sin(x)
y2 = cos(x)

source = ColumnDataSource(data=dict(x=x, y=y, y2=y2))

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(
    x_range=xdr, y_range=ydr,
    plot_width=1000, plot_height=600,
    min_border=0,
    toolbar_location=None,
    background_fill_color='#F0F0F0',
    border_fill_color='lightgray',
)

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
plot.add_layout(LinearAxis(), 'right')

def add_legend(location, orientation, side):
    legend = Legend(
        # TODO: title
        items=[("line", [line]), ("circle", [circle])],
        location=location, orientation=orientation,
        border_line_color="black",
    )
    plot.add_layout(legend, side)

# Add legends in names positions e.g. 'top_right', 'top_left' (see plot for all)
for location in LegendLocation:
    add_legend(location, "vertical", "center")

# Add legend at fixed positions
add_legend((150, 50), "horizontal", "center")

# Add legend in side panels
add_legend("center_left", "horizontal", "above")
add_legend("center", "horizontal", "below")
add_legend("center", "vertical", "left")
add_legend("bottom_center", "vertical", "right")

output_file("legends.html")
show(plot)
