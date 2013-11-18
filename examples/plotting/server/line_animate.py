# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *
from bokeh.objects import Range1d

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("line.py example")

hold()

line(x, y, color="#3333ee", tools="pan,zoom,resize")
line([0,4*np.pi], [-1, 1], color="#ee3333", tools="pan,zoom,resize")

show()

import time
from bokeh.objects import Glyph
renderer = [r for r in curplot().renderers if isinstance(r, Glyph)][0]
ds = renderer.data_source
while True:
    for i in np.hstack((np.linspace(1, -1, 100), np.linspace(-1, 1, 100))):
        ds.data["y"] = y * i
        ds._dirty = True
        session().store_obj(ds)
        time.sleep(0.05)
