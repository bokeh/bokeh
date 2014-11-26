# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.plotting import *

x = np.linspace(0, 4*np.pi, 200)
y = np.sin(x)

output_server("line")

p = figure(title="simple line example")
p.line(x,y, color="#2222aa", line_width=2)

show(p)
