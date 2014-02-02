# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_cloud("line")

line(x,y, color="#0000FF", tools="pan,wheel_zoom,resize,embed")

show()
