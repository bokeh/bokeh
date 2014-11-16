import numpy as np
from bokeh.plotting import *

x = np.linspace(0, 4*np.pi, 80)
y = np.sin(x)

p = figure(title="simple line example", tools='pan,wheel_zoom,box_zoom')
p.line(x,y, color="#0000FF")

output_file("line.html", title="line.py example")
show(p)
