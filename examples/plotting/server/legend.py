# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.plotting import *

N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("legend")

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"

p1 = figure(title="Legend Example", tools=TOOLS)

p1.circle(x, y, legend="sin(x)")
p1.circle(x, 2*y, legend="2*sin(x)", color="orange", )
p1.circle(x, 3*y, legend="3*sin(x)", color="green", )

p2 = figure(title="Another Legend Example", tools=TOOLS)

p2.circle(x, y, legend="sin(x)")
p2.line(x, y, legend="sin(x)")

p2.line(x, 2*y, legend="2*sin(x)",
    line_dash=[4, 4], line_color="orange", line_width=2)

p2.square(x, 3*y, legend="3*sin(x)",
    fill_color=None, line_color="green")
p2.line(x, 3*y, legend="3*sin(x)",
    fill_color=None, line_color="green")

show(vplot(p1, p2))  # open a browser

