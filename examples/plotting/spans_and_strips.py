''' This example demonstrates the use of ``hspan``, ``vspan``, ``hstrip`` and
``vstrip``. It also demonstrates how the default ``HoverTool`` interacts with these glyphs.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.hspan, bokeh.plotting.figure.hstrip, bokeh.plotting.figure.vstrip
    :keywords: strips, hover tool

'''

from bokeh.io import show
from bokeh.models import HoverTool
from bokeh.plotting import figure

plot = figure()

plot.hspan(
    y=[0, 5, 15, 33],
    line_width=[1, 2, 3, 4], line_color="red",
    legend_label="h_span",
)
plot.vspan(
    x=[0, 5, 15, 33],
    line_width=[1, 2, 3, 4], line_color="blue",
    legend_label="v_span",
)

plot.hstrip(
    y0=[45, 60, 80],
    y1=[50, 70, 95],
    line_color="pink",
    fill_color="purple",
    hatch_pattern="x", hatch_color="yellow",
    legend_label="h_strip",
)
plot.vstrip(
    x0=[45, 60, 80],
    x1=[50, 70, 95],
    line_color="pink",
    fill_color="yellow",
    hatch_pattern="/", hatch_color="purple",
    legend_label="v_strip",
)

plot.legend.location = "bottom_left"
plot.add_tools(HoverTool())

show(plot)
