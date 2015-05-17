# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.plotting import figure, show, output_server, vplot

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("rect")

# fixed width and height
p1 = figure(title="width/height screen units")
p1.rect(x, y, 6, 4, color="tomato",
    width_units="screen", height_units="screen")

# variable width and height
w = 0.02*np.exp(1+0.1*x)
h = 0.2*abs(np.cos(x))
p2 = figure(title="variable width/height")
p2.rect(x, y, w, h, color="olivedrab", alpha=0.6)

# angle
a = -np.pi/6
p3 = figure(title="angle")
p3.rect(x, y, 0.1, 0.1, alpha=0.5, color="navy", angle=a)

show(vplot(p1, p2, p3))
