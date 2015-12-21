from numpy import pi, cos, sin, linspace, roll, zeros_like

from bokeh.plotting import figure
from bokeh.client import push_session
from bokeh.io import curdoc

M = 5
N = M*10 + 1
r_base = 8
theta = linspace(0, 2*pi, N)
r_x = linspace(0, 6*pi, N-1)
rmin = r_base - cos(r_x) - 1
rmax = r_base + sin(r_x) + 1

colors = ["FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8", "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"] * M

cx = cy = zeros_like(rmin)

# figure() function auto-adds the figure to curdoc()
p = figure(x_range=(-11, 11), y_range=(-11, 11))
r = p.annular_wedge(cx, cy, rmin, rmax, theta[:-1], theta[1:],
                    fill_color=colors, line_color="white")

# open a session to keep our local document in sync with server
session = push_session(curdoc())

ds = r.data_source

def update():
    rmin = roll(ds.data["inner_radius"], 1)
    rmax = roll(ds.data["outer_radius"], -1)
    ds.data.update(inner_radius=rmin, outer_radius=rmax)

curdoc().add_periodic_callback(update, 30)

session.show() # open the document in a browser

session.loop_until_closed() # run forever
