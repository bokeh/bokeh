import numpy as np

from bokeh.plotting import *

N = 1000

x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)

output_file("image.html", title="image.py example")

p = figure(x_range=[0, 10], y_range=[0, 10])
p.image(image=[d], x=[0], y=[0], dw=[10], dh=[10], palette="Spectral11")

show(p)  # open a browser
