# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.plotting import *

N = 1000

x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)

output_server("image")

p = figure(x_range=[0, 10], y_range=[0, 10])
p.image(image=[d], x=[0], y=[0], dw=[10], dh=[10], palette="Spectral11")

show(p)  # open a browser
