""" To view this example, first start a Bokeh server:

    bokeh serve --allow-websocket-origin=localhost:8000

And then load the example into the Bokeh server by
running the script:

    python animated.py

in this directory. Finally, start a simple web server
by running:

    python -m SimpleHTTPServer  (python 2)

or

    python -m http.server  (python 3)

in this directory. Navigate to

    http://localhost:8000/animated.html

"""
from __future__ import print_function

import io

from numpy import pi, cos, sin, linspace, roll

from bokeh.client import push_session
from bokeh.embed import autoload_server
from bokeh.plotting import figure, curdoc

M = 5
N = M*10 + 1
r_base = 8
theta = linspace(0, 2*pi, N)
r_x = linspace(0, 6*pi, N-1)
rmin = r_base - cos(r_x) - 1
rmax = r_base + sin(r_x) + 1

colors = ["FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8",
          "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"] * 5

p = figure(x_range=(-11, 11), y_range=(-11, 11))
r = p.annular_wedge(0, 0, rmin, rmax, theta[:-1], theta[1:],
                    fill_color=colors, line_color="white")

# add the plot to curdoc
curdoc().add_root(p)

# open a session which will keep our local doc in sync with server
session = push_session(curdoc())

html = """
<html>
  <head></head>
  <body>
    %s
  </body>
</html>
""" % autoload_server(p, session_id=session.id)

with io.open("animated.html", mode='w+', encoding='utf-8') as f:
    f.write(html)

print(__doc__)

ds = r.data_source

def update():
    rmin = roll(ds.data["inner_radius"], 1)
    rmax = roll(ds.data["outer_radius"], -1)
    ds.data.update(inner_radius=rmin, outer_radius=rmax)

curdoc().add_periodic_callback(update, 30)

session.loop_until_closed() # run forever
