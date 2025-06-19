'''This example shows how to change the behavior for the axis label correction by changing the
axis label correction policy.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.vbar
    :keywords: axis_label_correction_policy

'''
from bokeh.core.enums import CorrectionPolicy, LabelOrientation
from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models import Select
from bokeh.plotting import figure

fruits = [
    'Apples Apples Apples Apples Apples\nApples Apples Apples Apples',
    'Pears Pears Pears Pears Pears Pears\nPears Pears Pears Pears Pears',
    'Nectarines Nectarines Nectarines\nNectarines Nectarines Nectarines',
    'Plums Plums Plums Plums Plums Plums\nPlums Plums Plums Plums Plums Plums',
    'Grapes Grapes Grapes Grapes Grapes\nGrapes Grapes Grapes Grapes Grapes',
    'Strawberries Strawberries Strawberries\nStrawberries Strawberries Strawberries',
]
counts = [5e8, 3e8, 4e8, 2e8, 4e8, 6e8]

# sorting the bars means sorting the range factors
sorted_fruits = sorted(fruits, key=lambda x: counts[fruits.index(x)])

p = figure(x_range=sorted_fruits, height=500, width=300, title="Fruit counts")

p.vbar(x=fruits, top=counts, width=0.9)

p.xgrid.grid_line_color = None
p.y_range.start = 0
p.xaxis.major_label_orientation = 3.1415 / 4
p.yaxis.major_label_orientation = -3.1415 / 4
p.yaxis[0].formatter.power_limit_high = 9

orientations = list(LabelOrientation)
correction_policies = list(CorrectionPolicy)

x_axis_orientation = Select(
    title="X-Axis label orientation", options=orientations, value=p.xaxis.major_label_orientation,
)
x_axis_orientation.js_link("value", p.xaxis[0], "major_label_orientation")

x_correction_policy = Select(
    title="X-Axis label correction policy", options=correction_policies, value=p.xaxis.label_correction_policy,
)
x_correction_policy.js_link("value", p.xaxis[0], "label_correction_policy")

y_axis_orientation = Select(
    title="Y-Axis label orientation", options=orientations, value=p.yaxis.major_label_orientation,
)
y_axis_orientation.js_link("value", p.yaxis[0], "major_label_orientation")

y_correction_policy = Select(
    title="Y-Axis label correction policy", options=correction_policies, value=p.yaxis.label_correction_policy,
)
y_correction_policy.js_link("value", p.yaxis[0], "label_correction_policy")

show(
    column(
        row(
            column(x_axis_orientation, x_correction_policy),
            column(y_axis_orientation, y_correction_policy),
        ),
        p,
    ),
)
