# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

from __future__ import division

import numpy as np

from bokeh.plotting import figure, show, output_server

# Generate the nessessary data
xs = np.linspace(-10, 10, 50)
ys = np.linspace(-10, 10, 50)
ys = ys[:,np.newaxis]
z = np.matrix(np.exp(-4*np.log(2)*((xs - 0)**2 + (ys-0)**2) / 80))

# Define the color mapper
lcmap = bkmdl.LinearBreaksColorMapper(palette = {0:'#FFFFFF', 0.2:'#01Fa10', 0.5:'#0000FF', 1:'#FF0000'}, alpha = [0.1, 1, 0.75, 0.5])

output_server("linear_breaks_color_mapper")

# Build the plot
p = figure(x_range = [-10,10], y_range = [-10,10])
p.image(image = [z], x = [-10], y = [-10], dw = [20], dh = [20], color_mapper = lcmap)

# Display the plot
show(p)

