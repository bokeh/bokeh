# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("rect")

figure(tools="pan,wheel_zoom,box_zoom,reset,previewsave")

# fixed width and height
rect(x, y, 4, 2, width_units="screen", height_units="screen",
    color="#ff0000", name="rect_example")

# variable width and height
rect(x, y, 0.01*np.exp(1+0.1*x), 0.2*abs(np.cos(x)),
     fill_color="green", line_color=None, fill_alpha=0.6)

# angle
rect(x, y, 0.05, 0.1, color="#4444aa", angle=-np.pi/6, name="rect_example4")

show()
