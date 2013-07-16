# The plot server must be running

import numpy as np
from bokeh.plotting import *

x = np.linspace(-7, 7, 100)
y = np.sin(x)

# Go to http://localhost:5006/bokeh to view this plot
output_server("color example")
hold(True)
scatter(x,y, tools="pan,zoom,resize")
scatter(x,2*y, tools="pan,zoom,resize")
scatter(x,3*y, color="green", tools="pan,zoom,resize")

figure()

plot(x,y, points=True, radius=2, tools="pan,zoom,resize,select")
plot(x,2*y, points=False)
plot(x,3*y, points=True, color="green", radius=2)
