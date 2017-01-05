""" This example shows how a Bokeh plot can be embedded in an HTML
document, in a way that the plot resizes to make use of the available
width and height (while keeping the aspect ratio fixed).

To make this work well, the plot should be placed in a container that
*has* a certain width and height (i.e. non-scrollable), which is the
body element in this case. A more realistic example might be embedding
a plot in a Phosphor widget.

"""
import random

from bokeh.io import output_file, show
from bokeh.plotting import figure

PLOT_OPTIONS = dict(plot_width=600, plot_height=400)
SCATTER_OPTIONS = dict(size=12, alpha=0.5)

data = lambda: [random.choice([i for i in range(100)]) for r in range(10)]

red = figure(sizing_mode='scale_both', tools='pan', **PLOT_OPTIONS)
red.scatter(data(), data(), color="red", **SCATTER_OPTIONS)

output_file('embed_responsive_width_height.html')
show(red)
