# -*- coding: utf-8 -*-
import numpy as np
from bokeh.plotting import figure, output_file, show

# prepare data
mu, sigma = 0, 0.5
measured = np.random.normal(mu, sigma, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)
x = np.linspace(-2, 2, 1000)

# output to static HTML file
output_file('histogram.html')

p = figure(title="Histogram", background_fill="#E8DDCB")
p.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649")

# customize axes
xa, ya = p.axis
xa.axis_label = 'x'
ya.axis_label = 'Pr(x)'

show()