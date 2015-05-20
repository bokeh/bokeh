import numpy as np

from bokeh.plotting import figure, show, output_file

x = np.linspace(0, 4*np.pi, 200)
y = np.sin(x)

output_file("line.html", title="line.py example")

p = figure(title="simple line example")
p.line(x,y, color="#2222aa", line_width=2)

p.ygrid[0].ticker.desired_num_ticks = 20

show(p)
