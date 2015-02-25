# The bokeh-server must be running to see this example

from __future__ import print_function

from bokeh.plotting import cursession, figure, output_server, show, push
from bokeh.models import GlyphRenderer
import bokeh.embed as embed

import time
from numpy import pi, cos, sin, linspace, roll

N = 50 + 1
r_base = 8
theta = linspace(0, 2 * pi, N)
r_x = linspace(0, 6 * pi, N - 1)
rmin = r_base - cos(r_x) - 1
rmax = r_base + sin(r_x) + 1

colors = ["FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8",
          "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"] * 5

output_server("animated")

p = figure(x_range=[-11, 11], y_range=[-11, 11])

p.annular_wedge(
    0, 0, rmin, rmax, theta[:-1], theta[1:],
    inner_radius_units="data",
    outer_radius_units="data",
    fill_color = colors,
    line_color="black",
)

push()

tag = embed.autoload_server(p, cursession())
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

    python -m SimpleHTTPServer (or http.server on python 3)

in this directory, then navigate to

    http://localhost:8000/animated_embed.html
""")

renderer = p.select(dict(type=GlyphRenderer))
ds = renderer[0].data_source

while True:

    rmin = ds.data["inner_radius"]
    rmin = roll(rmin, 1)
    ds.data["inner_radius"] = rmin

    rmax = ds.data["outer_radius"]
    rmax = roll(rmax, -1)
    ds.data["outer_radius"] = rmax

    cursession().store_objects(ds)
    time.sleep(0.1)
