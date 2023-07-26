'''This example shows different ways to place legends on a graph using the different location values included in the enumeration ``LegendLocation``.
The legend can be defined in terms of title, shape and orientation. This graph shows sin and cos plots.

.. bokeh-example-metadata::
    :apis: bokeh.core.enums.LegendLocation, bokeh.models.ColumnDataSource, bokeh.models.DataRange1d, bokeh.models.Plot, bokeh.models.Legend
    :refs: :ref:`ug_styling_plots_legends`
    :keywords: sin, cos, pi, linspace, LegendLocation
'''

from numpy import cos, linspace, pi, sin

from bokeh.core.enums import LegendLocation
from bokeh.io import show
from bokeh.models import (ColumnDataSource, DataRange1d, Legend, Line, LinearAxis,
                          PanTool, Plot, SaveTool, Scatter, WheelZoomTool)

x = linspace(-2*pi, 2*pi, 400)
y = sin(x)
y2 = cos(x)

source = ColumnDataSource(data=dict(x=x, y=y, y2=y2))

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(
    x_range=xdr, y_range=ydr,
    width=1000, height=600,
    min_border=0,
    toolbar_location=None,
    background_fill_color='#F0F0F0',
    border_fill_color='lightgray',
)

line_glyph = Line(x="x", y="y", line_color="navy", line_width=2, line_dash="dashed")
line = plot.add_glyph(source, line_glyph)
circle = Scatter(x="x", y="y2", size=6, line_color="red", fill_color="orange", fill_alpha=0.6)
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
        title='Example Title',
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

show(plot)
