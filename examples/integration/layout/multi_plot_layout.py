from __future__ import absolute_import

from bokeh.plotting import figure, save
from bokeh.layouts import gridplot
from bokeh.models import Range1d, LinearAxis

def fig(color, row, col):
    p = figure(width=150, height=150, min_border=5, toolbar_location=None)
    p.circle(x=0, y=0, radius=1, color=color)
    if row % 2 == 0:
        p.extra_x_ranges["x"] = Range1d(0, 100)
        p.add_layout(LinearAxis(x_range_name="x"), "above")
    if col % 2 == 1:
        p.extra_y_ranges["y"] = Range1d(0, 100)
        p.add_layout(LinearAxis(y_range_name="y"), "right")
    return p

ncols = 8
nrows = 8

figures = []
for col in range(0, ncols):
    for row in range(0, nrows):
        x = 100.0/ncols*col
        y = 100.0/nrows*row
        r, g, b = int(50+2*x), int(30+2*y), 150
        color = "#%02x%02x%02x" % (r, g, b)
        figures.append(fig(color, row, col))

save(gridplot(figures, ncols=ncols, toolbar_location=None))
