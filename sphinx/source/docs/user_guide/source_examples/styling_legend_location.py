import numpy as np
from bokeh.plotting import figure, show, output_file

x = np.linspace(0, 4*np.pi, 100)
y = np.sin(x)

output_file("legend_labels.html")

p = figure()

p.circle(x, y, legend="sin(x)")
p.line(x, y, legend="sin(x)")

p.line(x, 2*y, legend="2*sin(x)",
       line_dash=[4, 4], line_color="orange", line_width=2)

p.square(x, 3*y, legend="3*sin(x)", fill_color=None, line_color="green")
p.line(x, 3*y, legend="3*sin(x)", line_color="green")

p.legend.location = "bottom_left"

show(p)
