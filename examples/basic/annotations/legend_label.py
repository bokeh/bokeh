import numpy as np

from bokeh.plotting import figure, show

x = np.linspace(0, 4*np.pi, 100)
y = np.sin(x)

p = figure()

p.scatter(x, y, size=3, marker="square", legend_label="sin(x)", line_color="green")
p.line(x, y, legend_label="sin(x)", line_color="green")

p.line(x, 2*y, legend_label="2*sin(x)",
       line_dash=[4, 4], line_color="orange", line_width=2)

p.scatter(x, 3*y, legend_label="3*sin(x)", size=7, fill_color=None)
p.line(x, 3*y, legend_label="3*sin(x)")

show(p)
