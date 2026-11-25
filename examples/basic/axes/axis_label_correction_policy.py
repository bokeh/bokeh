"""This example shows how to change the behavior for the axis label correction by changing the
axis label correction policy.

.. bokeh-example-metadata::
    :title: Axis label correction policy
    :apis: bokeh.plotting.figure.vbar
    :keywords: axis label, correction policy

"""

from bokeh.core.enums import CorrectionPolicy, LabelOrientation
from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models import CustomJS, Select
from bokeh.plotting import figure

fruits = ["Strawberries with a multi\nline label", "Oranges", "Apples"]
counts = [500, 600, 100]

p = figure(x_range=fruits, height=300, width=300, tools="pan,reset")
p.vbar(x=fruits, top=counts, width=0.9)

p.xgrid.grid_line_color = None
p.xaxis.major_label_orientation = 3.1415 / 4
p.yaxis.major_label_orientation = -3.1415 / 4
p.y_range.start = 0
p.y_range.end = 600

orientations: list[str | None] = list(LabelOrientation)
x_orientations = [*orientations, str(p.xaxis.major_label_orientation)]
y_orientations = [*orientations, str(p.yaxis.major_label_orientation)]
policies: list[str | None] = list(CorrectionPolicy)

custom_js_str = "other.major_label_orientation = isNaN(this.value) ? this.value : Number(this.value)"

x_axis_orientation = Select(
    title="X-Axis label orientation",
    options=x_orientations,
    value=str(p.xaxis.major_label_orientation),
)
x_axis_orientation.js_on_change("value", CustomJS(args=dict(other=p.xaxis[0]), code=custom_js_str))

x_correction_policy = Select(
    title="X-Axis label correction policy",
    options=policies,
    value=p.xaxis.axis_label_correction_policy,
)
x_correction_policy.js_link("value", p.xaxis[0], "axis_label_correction_policy")

y_axis_orientation = Select(
    title="Y-Axis label orientation",
    options=y_orientations,
    value=str(p.yaxis.major_label_orientation),
)
y_axis_orientation.js_on_change("value", CustomJS(args=dict(other=p.yaxis[0]), code=custom_js_str))

y_correction_policy = Select(
    title="Y-Axis label correction policy",
    options=policies,
    value=p.yaxis.axis_label_correction_policy,
)
y_correction_policy.js_link("value", p.yaxis[0], "axis_label_correction_policy")

c_x = column(x_axis_orientation, x_correction_policy)
c_y = column(y_axis_orientation, y_correction_policy)
r = row(c_x, c_y)
show(column(r, p))
