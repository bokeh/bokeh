from __future__ import division

import numpy as np
from bokeh.plotting import *
from bokeh.objects import Range1d

# Skip the first point because it can be troublesome
theta = np.linspace(0, 8*np.pi, 10000)[1:]

# Compute the radial coordinates for some different spirals
lituus = theta**(-1/2)          # lituus
golden = np.exp(0.306349*theta) # golden
arch   = theta                  # Archimedean
fermat = theta**(1/2)           # Fermat's

# Now compute the X and Y coordinates (polar mappers planned for Bokeh later)
golden_x = golden*np.cos(theta)
golden_y = golden*np.sin(theta)
lituus_x = lituus*np.cos(theta)
lituus_y = lituus*np.sin(theta)
arch_x   = arch*np.cos(theta)
arch_y   = arch*np.sin(theta)
fermat_x = fermat*np.cos(theta)
fermat_y = fermat*np.sin(theta)

# output to static HTML file
output_file("lines.html")

# Plot the Archimedean spiral using the `line` renderer. Note how we set the
# color, line thickness, title, and legend value.
line(arch_x, arch_y, color="red", line_width=2,
     title="Archimean", legend="Archimedean")

# EXERCISE: reproduce the above plot for one of the other spirals
line(golden_x, golden_y, color="orange", line_width=2,
     title="golden", legend="golden")

# Let's try to put all lines on one plot for comparison. First we need to
# turn on `hold` so that each renderer does not create a brand new plot
hold()

# Next we need to actually create a new figure, so that the following
# renderers work on a new plot, and not the last one.
figure()

# EXERCISE: add all four spirals to one plot, each with different line colors
# and legend values. NOTE: title only set on the first renderer.
line(golden_x, golden_y, color="#BD1550", line_width=2,
     legend="golden", title="Various Spirals")
line(lituus_x, lituus_y, color="#E97F02", line_width=2, legend="lituus")
line(arch_x,   arch_y,   color="#F8CA00", line_width=2, legend="Archimedean")
line(fermat_x, fermat_y, color="#8A9B0F", line_width=2, legend="Fermat")

# OK, so that doesn't look so good because Bokeh tried to autoscale to
# accomodate all the data. We can use the Range1d object to set the plot range
# explicitly

# EXERCISE: create a new figure
figure()

# EXERCISE: add x_range and y_range parameters to the first `line`, to set the
# range to [-10, 10]. NOTE: Range1d are created like: Range1d(start=0, end-10)
line(golden_x, golden_y, color="#BD1550", line_width=2,
     legend="golden", title="Various Spirals",
     x_range=Range1d(start=-10, end=10), y_range=Range1d(start=-10, end=10))
line(lituus_x, lituus_y, color="#E97F02", line_width=2, legend="lituus")
line(arch_x,   arch_y,   color="#F8CA00", line_width=2, legend="Archimedean")
line(fermat_x, fermat_y, color="#8A9B0F", line_width=2, legend="Fermat")

show()      # show the plot