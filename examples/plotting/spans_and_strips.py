'''This Python script uses Bokeh to create a plot featuring a combination of horizontal and vertical spans and strips, with various line widths, colors, and hatch patterns. The figure object 
is initialized to serve as the plotting canvas. Horizontal spans (hspan) are drawn at specific y positions (0, 5, 15, 33), with line widths ranging from 1 to 4 and colored red. Vertical spans 
(vspan) are similarly placed at x positions (0, 5, 15, 33), using the same line widths but with blue coloring.

Additionally, horizontal strips (hstrip) are drawn between the y-coordinates 45 to 50, 60 to 70, and 80 to 95, featuring purple fill colors, pink outlines, and yellow "x" hatch patterns. Vertical 
strips (vstrip) are also included, spanning the x-coordinates 45 to 50, 60 to 70, and 80 to 95, but with yellow fill colors, pink outlines, and purple diagonal hatch patterns. These visual elements 
are labeled in the legend, which is positioned at the bottom left of the plot.

The script also includes a HoverTool, which enhances interactivity by allowing users to explore the details of the plot elements when hovering over them. Finally, the show function renders the plot, 
displaying the various spans and strips in a visually distinct and organized manner.

.. bokeh-example-metadata::
    :sampledata:spans_and_strips
    :apis:bokeh.plotting.Figure
    :refs: :ref:`userguide_data`
    :keywords: spans, strips, span, strip

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
