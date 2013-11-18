
import time
from numpy import pi, cos, sin, linspace, roll, zeros_like
from bokeh.plotting import *
from bokeh.objects import Glyph, Range1d

N = 50 + 1
r_base = 8
theta = linspace(0, 2*pi, N)
r_x = linspace(0, 6*pi, N-1)
rmin = r_base - cos(r_x) - 1
rmax = r_base + sin(r_x) + 1

colors = ["FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8", "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"] * 5

cx = cy = np.zeros_like(rmin)

output_server("animated.py example")

hold()

annular_wedge(
    cx, cy, rmin, rmax, theta[:-1], theta[1:],
    x_range = Range1d(start=-11, end=11),
    y_range = Range1d(start=-11, end=11),
    inner_radius_units="data",
    outer_radius_units="data",
    fill_color = colors,
    line_color="black",
    tools="pan,zoom,resize"
)

renderer = [r for r in curplot().renderers if isinstance(r, Glyph)][0]
ds = renderer.data_source
while True:
    for i in linspace(-2*pi, 2*pi, 50):
        rmin = ds.data["inner_radius"]
        rmin = roll(rmin, 1)
        ds.data["inner_radius"] = rmin
        rmax = ds.data["outer_radius"]
        rmax = roll(rmax, -1)
        ds.data["outer_radius"] = rmax
        ds._dirty = True
        session().store_obj(ds)
        time.sleep(.10)
