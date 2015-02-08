import numpy as np
from bokeh.plotting import *
from bokeh.models import ColumnDataSource

output_file("linked_panning.html", title="linked_panning.py example")

N = 300
x = np.linspace(0, 4*np.pi, N)
y1 = np.sin(x)
y2 = np.cos(x)
y3 = np.sin(x) + np.cos(x)

s1 = figure(plot_width=350, plot_height=350)
s1.scatter(x, y1)

# Linked panning in Bokeh is expressed by sharing ranges between
# plots. Note below that s2 is reated with the `x_range` and `y_range`
# keyword arguments, and supplied with the same ranges from s1. Here,
# this links both axes together.
s2 = figure(plot_width=350, plot_height=350,
            x_range=s1.x_range, y_range=s1.y_range)
s2.scatter(x, y2)

# It is possible to share just one range or the other, to link plots
# along only one dimension. For the third plot, we only link the x-axis
s3 = figure(plot_width=350, plot_height=350, x_range=s1.x_range)
s3.scatter(x, y3)

p = gridplot([[s1,s2, s3]])
show(p)
