# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("line.py example")

line(x,y, color="#0000FF", tools="pan,zoom,resize")

show()

import time
from bokeh.objects import GlyphRenderer
renderer = [r for r in curplot().renderers if isinstance(r, GlyphRenderer)][0]
ds = renderer.data_source
while True:
    for i in np.linspace(-2*np.pi, 2*np.pi, 50):
        ds.data["x"] = x + i
        ds._dirty = True
        session().store_obj(ds)
        time.sleep(0.05)
