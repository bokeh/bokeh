# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import time
import numpy as np
from numpy import pi, cos, sin, linspace, roll, zeros_like
from bokeh.plotting import *
from bokeh.objects import Glyph

N = 50 + 1
r_base = 8
theta = linspace(0, 2*pi, N)
r_x = linspace(0, 6*pi, N-1)
rmin = r_base - cos(r_x) - 1
rmax = r_base + sin(r_x) + 1

colors = ["FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8", "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"] * 5

cx = cy = zeros_like(rmin)

output_server("animated")

figure(x_range=[-11, 11], y_range=[-11, 11], tools="pan,wheel_zoom,box_zoom,reset,previewsave")

hold()

annular_wedge(
    cx, cy, rmin, rmax, theta[:-1], theta[1:],
    inner_radius_units="data",
    outer_radius_units="data",
    fill_color = colors,
    line_color="black",
)

renderer = [r for r in curplot().renderers if isinstance(r, Glyph)][0]
ds = renderer.data_source
show()
while True:
    for i in linspace(-2*pi, 2*pi, 50):
        rmin = ds.data["inner_radius"]
        rmin = roll(rmin, 1)
        ds.data["inner_radius"] = rmin
        rmax = ds.data["outer_radius"]
        rmax = roll(rmax, -1)
        ds.data["outer_radius"] = rmax
        cursession().store_objects(ds)
        time.sleep(.10)
