from __future__ import division

import numpy as np
from six.moves import zip
from bokeh.plotting import *
from bokeh.objects import Range1d

# Recreate the Fermat spiral from the last exercise, with some different scalings
# and number of turnings
theta1 = np.linspace(0, 256*np.pi, 500)[1:]
f1 = theta1**(1/2)
x1 = 0.5*f1*np.cos(theta1)
y1 = 0.5*f1*np.sin(theta1)

theta2 = np.linspace(0, 96*np.pi, 500)[1:]
f2 = theta2**(1/2)
x2 = f2*f2*np.cos(theta2)
y2 = f2*f2*np.sin(theta2)

theta3 = np.linspace(0, 32*np.pi, 500)[1:]
f3 = 2*theta3**(1/2)
x3 = 2*f3*np.cos(theta3)
y3 = 2*f3*np.sin(theta3)

# EXERCISE: output static HTML file
output_file("scatter.html")

# Create a set of tools to use
TOOLS="pan,wheel_zoom,box_zoom,reset,previewsave"

# EXERCISE: create two Range1d objects to reuse in the plots. Use the [-20, 20]
# for the bounds. Note: Range1d's are initialized like: Range1d(start=0, end=1)
xr = Range1d(start=-20, end=20)
yr = Range1d(start=-20, end=20)

# EXERCISE: Plot all the sets of points on different plots. Use the ranges above
# for x_range and y_range. Set different colors as well. Try setting line_color
# and fill_color instead of just color. You can also set alpha, line_alpha, and
# fill_alpha if you like. Set tools to TOOLS on the first renderer. Change
# the value of the 'marker' parameter, "circle", "square", "triangle", etc. One
# example is given
scatter(x1, y1, size=12, color="red", alpha=0.5,
        x_range=xr, y_range=yr, tools=TOOLS)
scatter(x2, y2, size=12, color="blue", fill_alpha=0.5,
        x_range=xr, y_range=yr, marker="square")
scatter(x3, y3, size=12, fill_color="green", line_color="orange",
        x_range=xr, y_range=yr, marker="triangle")

# EXERCISE: Try panning and zooming one of the plots with another one visible!
# Set the plot_width and plot_height to smaller if necessary

# EXERCISE: create a new figure
figure()

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
circle(x, y, radius=radii,
       fill_color=colors, fill_alpha=0.6,
       line_color=None, Title="Colorful Scatter")

# NOTE: since we are passing 'radius' as a parameter, the size of the circles
# is computed in **data** space, not in pixels. If you'd like to specify
# radii in pixels, use: radius_units="screen"

show()  # open a browser
