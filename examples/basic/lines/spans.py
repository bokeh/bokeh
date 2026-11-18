''' Draw horizontal and vertical lines that span the full frame.

.. bokeh-example-metadata::
    :title: Spans
    :keywords: spans, basic plotting, lines
    :apis: bokeh.plotting.figure.hspan, bokeh.plotting.figure.vspan
'''

from bokeh.io import show
from bokeh.plotting import figure

plot = figure()

plot.hspan(
    y=[0, 5, 15, 33],
    line_width=[1, 2, 3, 4], line_color="red",
)
plot.vspan(
    x=[0, 5, 15, 33],
    line_width=[1, 2, 3, 4], line_color="blue",
)

show(plot)
