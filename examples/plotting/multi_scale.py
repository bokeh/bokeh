'''This example shows a graph with multiple scales on y-axis.
This can be used to depict values in two different units.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.plotting.figure.scatter, bokeh.plotting.figure.add_layout
    :keywords: scale

'''
from bokeh.io import show
from bokeh.models import LinearAxis, LinearScale, Range1d
from bokeh.plotting import figure

source = {
    "t": [0,  1,   2,    3,     4],
    "v": [1, 10, 100, 1000, 10000],
}

f = figure(y_axis_type="log")

f.yaxis.axis_label = "Log"
f.yaxis.axis_label_text_color = "blue"

f.extra_y_ranges = {"linear": Range1d(-1000, 20000)}
f.extra_y_scales = {"linear": LinearScale()}

ax = LinearAxis(y_range_name="linear", axis_label="Linear", axis_label_text_color="red")
f.add_layout(ax, "left")

f.line(x="t", y="v", line_width=2, source=source, color="blue")
f.scatter(x="t", y="v", size=5, line_width=2, source=source, color="blue")

f.line(x="t", y="v", line_width=2, source=source, y_range_name="linear", color="red")
f.scatter(x="t", y="v", size=5, line_width=2, source=source, y_range_name="linear", color="red")

show(f)
