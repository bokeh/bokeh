# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import time

import numpy as np

from bokeh.plotting import cursession, figure, show, output_server

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("line_animate")

p = figure()

p.line(x, y, color="#3333ee", name="sin")
p.line([0,4*np.pi], [-1, 1], color="#ee3333")

show(p)

renderer = p.select(dict(name="sin"))
ds = renderer[0].data_source

while True:
    for i in np.hstack((np.linspace(1, -1, 100), np.linspace(-1, 1, 100))):
        ds.data["y"] = y * i
        cursession().store_objects(ds)
        time.sleep(0.05)
