# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *

N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("legend.py example")

hold()

scatter(x,y, tools="pan,zoom,resize", legend="sin(x)")
scatter(x,2*y, tools="pan,zoom,resize", legend="2*sin(x)")
scatter(x,3*y, color="green", tools="pan,zoom,resize", legend="3*sin(x)")

figure()

plot(x,y, points=True, radius=2, tools="pan,zoom,resize,select", legend="sin(x)")
plot(x,2*y, points=False, legend="2*sin(x)")
plot(x,3*y, points=True, color="green", radius=2, legend="3*sin(x)")

show()
