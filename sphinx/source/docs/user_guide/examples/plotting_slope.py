import numpy as np

from bokeh.plotting import figure, show, output_file
from bokeh.models import Slope

output_file("slope.html", title="slope.py example")

# linear equation parameters
gradient = 2
y_intercept = 10

# create random data
xpts = np.arange(0, 20)
ypts = gradient * xpts + y_intercept + np.random.normal(0, 4, 20)

p = figure(plot_width=450, plot_height=450, y_range=(0, 1.1 * max(ypts)))

p.circle(xpts, ypts, size=5, color="skyblue")

slope = Slope(gradient=gradient, y_intercept=y_intercept,
              line_color='orange', line_dash='dashed', line_width=3.5)

p.add_layout(slope)

p.yaxis.axis_label = 'y'
p.xaxis.axis_label = 'x'

show(p)
