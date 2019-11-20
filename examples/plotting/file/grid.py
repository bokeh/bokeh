import numpy as np

from bokeh.plotting import figure, gridplot, output_file, show

N = 50

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,crosshair"

l = figure(title="line", tools=TOOLS, plot_width=300, plot_height=300)
l.line(x,y, line_width=3, color="gold")

aw = figure(title="annular wedge", tools=TOOLS, plot_width=300, plot_height=300)
aw.annular_wedge(x, y, 10, 20, 0.6, 4.1, color="navy", alpha=0.5,
    inner_radius_units="screen", outer_radius_units="screen")

bez = figure(title="bezier", tools=TOOLS, plot_width=300, plot_height=300)
bez.bezier(x, y, x+0.4, y, x+0.1, y+0.2, x-0.1, y-0.2,
    line_width=2, color="olive")

q = figure(title="quad", tools=TOOLS, plot_width=300, plot_height=300)
q.quad(x, x-0.2, y, y-0.2, color="tomato", alpha=0.4)

# specify "empty" grid cells with None
p = gridplot([[l, None, aw], [bez, q, None]])

output_file("grid.html", title="grid.py example")

show(p)
