from numpy import pi, cos, sin, linspace, roll

from bokeh.client import push_session
from bokeh.plotting import figure, curdoc

M = 5
N = M*10 + 1
r_base = 8
theta = linspace(0, 2*pi, N)
r_x = linspace(0, 6*pi, N-1)
rmin = r_base - cos(r_x) - 1
rmax = r_base + sin(r_x) + 1

colors = ["#FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8", "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"] * M

p = figure(x_range=(-11, 11), y_range=(-11, 11))
r = p.annular_wedge(0, 0, rmin, rmax, theta[:-1], theta[1:],
                    fill_color=colors, line_color="white")

ds = r.data_source

def update():
    rmin = roll(ds.data["inner_radius"], 1)
    rmax = roll(ds.data["outer_radius"], -1)
    ds.data.update(inner_radius=rmin, outer_radius=rmax)

document = curdoc()
document.add_root(p)
document.add_periodic_callback(update, 60)

if __name__ == "__main__":
    print("\nanimating... press ctrl-C to stop")
    session = push_session(document)
    session.show()
    session.loop_until_closed()
