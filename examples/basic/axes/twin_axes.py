'''This example shows how to add a secondary y-axis to a figure and set a color
for the label values.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.add_layout, bokeh.plotting.figure.scatter, bokeh.models.LinearAxis
    :refs: :ref:`ug_basic_axes_twin`
    :keywords: add_layout, axis, axis_label, axis_label_text_color, scatter, extra_y_ranges, LinearAxis

'''
from numpy import arange, linspace, pi, sin

from bokeh.models import LinearAxis, Range1d
from bokeh.plotting import figure, show

x = arange(-2*pi, 2*pi, 0.2)
y = sin(x)
y2 = linspace(0, 100, len(x))

p = figure(x_range=(-2*pi, 2*pi), y_range=(-1, 1))
p.background_fill_color = "#fafafa"

p.scatter(x, y, color="crimson", size=8)
p.yaxis.axis_label = "red circles"
p.yaxis.axis_label_text_color ="crimson"

p.extra_y_ranges['foo'] = Range1d(0, 100)
p.scatter(x, y2, color="navy", size=8, y_range_name="foo")

ax2 = LinearAxis(y_range_name="foo", axis_label="blue circles")
ax2.axis_label_text_color ="navy"
p.add_layout(ax2, 'left')

show(p)
