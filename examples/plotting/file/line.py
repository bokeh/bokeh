import numpy as np

from bokeh.plotting import figure, show, output_file

x = np.linspace(0, 2*np.pi, 50)
y = np.sin(x)*200 + 0.2

# t = np.linspace(0, 2*np.pi, 50)
# x = np.sin(t) / 10
# y = np.cos(t)

output_file("line.html", title="line.py example")

p = figure(title="simple line example", webgl=True)
p.line(x,y, color="#2222aa", line_width=6, line_cap='butt')

p.ygrid[0].ticker.desired_num_ticks = 20

show(p)
