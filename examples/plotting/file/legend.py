''' Line and marker plots that demonstrate automatic legends.

.. bokeh-example-metadata::
    :apis: bokeh.layouts.gridplot, bokeh.plotting.Figure.circle, bokeh.plotting.Figure.line, bokeh.plotting.Figure.square
    :refs: :ref:`userguide_annotations` > :ref:`userguide_annotations_legends`
    :keywords: gridplot

'''
import numpy as np

from bokeh.layouts import gridplot
from bokeh.plotting import figure, show

x = np.linspace(0, 4*np.pi, 100)
y = np.sin(x)

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"

p1 = figure(title="Legend Example", tools=TOOLS)

p1.circle(x,   y, legend_label="sin(x)")
p1.circle(x, 2*y, legend_label="2*sin(x)", color="orange")
p1.circle(x, 3*y, legend_label="3*sin(x)", color="green")

p1.legend.title = 'Example Title'

p2 = figure(title="Another Legend Example", tools=TOOLS)

p2.circle(x, y, legend_label="sin(x)")
p2.line(x, y, legend_label="sin(x)")

p2.line(x, 2*y, legend_label="2*sin(x)", line_dash=(4, 4), line_color="orange", line_width=2)

p2.square(x, 3*y, legend_label="3*sin(x)", fill_color=None, line_color="green")
p2.line(x, 3*y, legend_label="3*sin(x)", line_color="green")

show(gridplot([p1, p2], ncols=2, width=400, height=400))  # open a browser
