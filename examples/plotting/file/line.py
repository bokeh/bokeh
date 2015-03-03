import numpy as np

from bokeh.plotting import *

x = np.linspace(0, 4*np.pi, 200)
y = np.sin(x)

output_file("line.html", title="line.py example")

p = figure(title="simple line example")
p.line(x,y, color="#2222aa", line_width=2)

show(p)
