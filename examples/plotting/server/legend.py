# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *

N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("legend")

hold()

scatter(x,y, tools="pan,wheel_zoom,box_zoom,reset,previewsave", legend="sin(x)")
scatter(x,2*y, color="orange", tools="pan,wheel_zoom,box_zoom,reset,previewsave", legend="2*sin(x)")
scatter(x,3*y, color="green", tools="pan,wheel_zoom,box_zoom,reset,previewsave", legend="3*sin(x)")

figure()

scatter(x, y, tools="pan,wheel_zoom,box_zoom,reset,previewsave", legend="sin(x)")
line(x, y, tools="pan,wheel_zoom,box_zoom,reset,previewsave", legend="sin(x)")

line(x, 2*y, line_dash="4 4", line_color="orange", line_width=2, legend="2*sin(x)")

scatter(x, 3*y, fill_color=None, line_color="green", legend="3*sin(x)")
line(x, 3*y, fill_color=None, line_color="green", legend="3*sin(x)")

show()
