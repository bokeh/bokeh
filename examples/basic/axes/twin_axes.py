'''This example shows how to add a secondary y-axis to a figure and set a color
for the label values.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.add_layout, bokeh.plotting.figure.scatter, bokeh.models.LinearAxis
    :refs: :ref:`ug_basic_axes_twin`
    :keywords: add_layout, axis, axis_label, axis_label_text_color, scatter, extra_y_ranges, LinearAxis

'''
from numpy import arange, linspace, pi, sin

from bokeh.layouts import column
from bokeh.models import (CustomJS, LinearAxis, Range1d, Select,
                          WheelZoomTool, ZoomInTool, ZoomOutTool)
from bokeh.palettes import Sunset6
from bokeh.plotting import figure, show

x = arange(-2*pi, 2*pi, 0.2)
y = sin(x)
y2 = linspace(0, 100, len(x))

blue, red = Sunset6[2], Sunset6[5]

p = figure(x_range=(-2*pi, 2*pi), y_range=(-1, 1), tools="pan,box_zoom,save,reset")
p.background_fill_color = "#fafafa"

blue_circles = p.scatter(x, y, line_color="black", fill_color=blue, size=12)
p.axis.axis_label = "light blue circles"
p.axis.axis_label_text_color = blue

p.extra_x_ranges['foo'] = Range1d(-2*pi, 2*pi)
p.extra_y_ranges['foo'] = Range1d(0, 100)
red_circles = p.scatter(x, y2, color=red, size=8,
    x_range_name="foo",
    y_range_name="foo",
)

ax2 = LinearAxis(
    axis_label="red circles",
    x_range_name="foo",
    y_range_name="foo",
)
ax2.axis_label_text_color = red
p.add_layout(ax2, 'left')

ax3 = LinearAxis(
    axis_label="red circles",
    x_range_name="foo",
    y_range_name="foo",
)
ax3.axis_label_text_color = red
p.add_layout(ax3, 'below')

wheel_zoom = WheelZoomTool()
p.add_tools(wheel_zoom)

p.toolbar.active_scroll = wheel_zoom

zoom_in_blue = ZoomInTool(renderers=[blue_circles], description="Zoom in blue circles")
zoom_out_blue = ZoomOutTool(renderers=[blue_circles], description="Zoom out blue circles")
p.add_tools(zoom_in_blue, zoom_out_blue)

zoom_in_red = ZoomInTool(renderers=[red_circles], description="Zoom in red circles")
zoom_out_red = ZoomOutTool(renderers=[red_circles], description="Zoom out red circles")
p.add_tools(zoom_in_red, zoom_out_red)

select = Select(title="Zoom together:", options=["none", "cross", "all"], value=wheel_zoom.zoom_together)
select.js_on_change("value", CustomJS(
    args=dict(select=select, wheel_zoom=wheel_zoom),
    code="""\
export default ({select, wheel_zoom}) => {
  wheel_zoom.zoom_together = select.value
}
""",
))
show(column(select, p))
