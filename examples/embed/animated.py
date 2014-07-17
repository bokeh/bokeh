# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot
from __future__ import print_function
from bokeh.plotting import *
import bokeh.embed as embed

import time
from numpy import pi, cos, sin, linspace, roll, zeros_like
from bokeh.objects import Glyph, Range1d

N = 50 + 1
r_base = 8
theta = linspace(0, 2 * pi, N)
r_x = linspace(0, 6 * pi, N - 1)
rmin = r_base - cos(r_x) - 1
rmax = r_base + sin(r_x) + 1

colors = ["FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8",
          "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"] * 5

cx = cy = zeros_like(rmin)

output_server("animated")

hold()

plot = annular_wedge(
    cx, cy, rmin, rmax, theta[:-1], theta[1:],
    x_range=Range1d(start=-11, end=11),
    y_range=Range1d(start=-11, end=11),
    inner_radius_units="data",
    outer_radius_units="data",
    fill_color=colors,
    line_color="black",
    tools="pan,wheel_zoom,box_zoom,reset,previewsave"
)

tag = embed.autoload_server(plot, cursession())
html = """
<html>
  <head></head>
  <body>
    %s
  </body>
</html>
"""
html = html % (tag)
with open("animated_embed.html", "w+") as f:
    f.write(html)

print("""
To view this example, run

    python -m SimpleHTTPServer

in this directory, then navigate to

    http://localhost:8000/animated_embed.html
""")

renderer = [r for r in plot.renderers if isinstance(r, Glyph)][0]
ds = renderer.data_source

while True:
    for i in linspace(-2 * pi, 2 * pi, 50):
        rmin = ds.data["inner_radius"]
        rmin = roll(rmin, 1)
        ds.data["inner_radius"] = rmin
        rmax = ds.data["outer_radius"]
        rmax = roll(rmax, -1)
        ds.data["outer_radius"] = rmax
        ds._dirty = True
        cursession().store_objects(ds)
        time.sleep(.10)
