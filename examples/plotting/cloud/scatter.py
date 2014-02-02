# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *

N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_cloud("scatter")

scatter(x,y, color="#FF00FF", tools="pan,wheel_zoom,resize")
scatter(x,y, color="red", tools="pan,wheel_zoom,resize")
scatter(x,y, type="square", color="green", tools="pan,wheel_zoom,resize")
scatter(x,y, type="square", color="blue", tools="pan,wheel_zoom,resize")

show()
