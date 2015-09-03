import numpy as np

from bokeh.plotting import figure, show, output_file

x = np.linspace(0, 2*np.pi, 50)
y = np.sin(x)*10 + 0.2

output_file("line.html", title="line.py example")

p = figure(title="simple line example")
p.line(x,y, color="#2222aa", line_width=6)

p.ygrid[0].ticker.desired_num_ticks = 20

show(p)
