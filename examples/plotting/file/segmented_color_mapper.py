from __future__ import division

import numpy as np

from bokeh.plotting import figure, show, output_file
from bokeh.models import LinearBreaksColorMapper

# Generate the nessessary data
xs = np.linspace(-10, 10, 200)
ys = np.linspace(-10, 10, 200)
ys = ys[:,np.newaxis]
z = np.matrix(np.exp(-4*np.log(2)*((xs - 0)**2 + (ys-0)**2) / 80))

# Define the different colors and alpha levels (Rainbow!)
stops = np.linspace(0, 1, 7)
colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8F00FF']
alpha = [None] * len(stops)
palette = {}
for i in range(len(stops)):
    palette[stops[i]] = colors[i]
    alpha[i] = 0.8

# Define the color mapper
lcmap = LinearBreaksColorMapper(palette = palette, alpha = alpha)

output_file("linear_breaks_color_mapper.html", title="linear_breaks_color_mapper.py example")

# Build the plot
p = figure(x_range = [-10,10], y_range = [-10,10])
p.image(image = [z], x = [-10], y = [-10], dw = [20], dh = [20], color_mapper = lcmap)

# Display the plot
show(p)

