# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.plotting import figure, show, output_server, vplot

N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("scatter")

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"

p1 = figure(tools=TOOLS)
p1.scatter(x,y, color="#FF00FF", nonselection_fill_color="#FFFF00", nonselection_fill_alpha=1)

p2 = figure(tools=TOOLS)
p2.scatter(x,y, color="red")

p3 = figure(tools=TOOLS)
p3.scatter(x,y, marker="square", color="green")

p4 = figure(tools=TOOLS)
p4.scatter(x,y, marker="square", color="blue")

show(vplot(p1, p2, p3, p4))
