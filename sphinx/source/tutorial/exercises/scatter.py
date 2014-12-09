from __future__ import division

import numpy as np

from bokeh.plotting import figure, HBox, output_file, show, VBox
from bokeh.models import Range1d

# create some data using python lists
x1 = [1, 2,  5, 7,   -8, 5, 2, 7, 1,   -3, -5, 1.7, 5.4, -5]
y1 = [5, 6, -3, 1.5,  2, 1, 1, 9, 2.4, -3,  6, 8,   2,    4]

# create some data using numpy arrays
x2 = np.random.random(size=100) * 20 - 10
y2 = np.random.random(size=100) * 20 - 10

# EXERCISE: create some data for x3 and y3 however you like

# EXERCISE: output static HTML file

TOOLS="pan,wheel_zoom,box_zoom,reset,save"

# EXERCISE: create two Range1d objects to reuse in the plots. Use the [-10, 10]
# for the bounds. Note: Range1d's are initialized like: Range1d(start=0, end=1)

# EXERCISE: Plot all the sets of points on different plots p1, p2, p3. Use the
# ranges above for `x_range` and `y_range` for each figure. Set different colors
# as well. Try setting line_color and fill_color instead of just color. You can
# also set alpha, line_alpha, and fill_alpha if you like. Set tools to TOOLS on
# the figures. Change the value of the 'marker' parameter, "circle", "square",
# "triangle", etc. One example is given
p1 = figure(x_range=xr, y_range=yr, tools=TOOLS, plot_width=300, plot_height=300)
p1.scatter(x1, y1, size=12, color="red", alpha=0.5)

# EXERCISE: Try panning and zooming one of the plots with another one visible!
# Set the plot_width and plot_height to smaller if necessary

# EXERCISE: create a new figure p4

# Lets plot 4000 circles, you can play around with this if you like
N = 4000

# Create a bunch of random points, radii and colors for plotting
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = [
    "#%02x%02x%02x" % (r, g, 150) for r, g in zip(np.floor(50+2*x), np.floor(30+2*y))
]

# EXERCISE: use the `circle` renderer to scatter all the circles. Set the
# 'fill_color' to the colors above, the 'line_color' to None, and the 'radius'
# to the radii. Also try setting the fill_alpha to something less than one.
# Use TOOLS from above to set a tools parameter.

# NOTE: since we are passing 'radius' as a parameter, the size of the circles
# is computed in **data** space, not in pixels. If you'd like to specify
# radii in pixels, use: radius_units="screen"

# show the plots arrayed in a layout
show(VBox(HBox(p1, p2, p3), p4))
