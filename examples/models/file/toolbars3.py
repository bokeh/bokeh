import numpy as np

from bokeh.plotting import figure, show, output_file
from bokeh.layouts import row, column
from bokeh.models import ToolbarBox

N = 1000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = ["#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50+2*x, 30+2*y)]

TOOLS="hover,crosshair,pan,reset,box_select"

def mkplot():
    p = figure(width=300, height=300, tools=TOOLS, toolbar_location=None)
    p.scatter(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)
    return p

p_above = mkplot()
tb_above = ToolbarBox(toolbar=p_above.toolbar, toolbar_location="above")

p_below = mkplot()
tb_below = ToolbarBox(toolbar=p_below.toolbar, toolbar_location="below")

p_left = mkplot()
tb_left = ToolbarBox(toolbar=p_left.toolbar, toolbar_location="left")

p_right = mkplot()
tb_right = ToolbarBox(toolbar=p_right.toolbar, toolbar_location="right")

l_above = column(tb_above, p_above)
l_below = column(p_below, tb_below)
l_left  = row(tb_left, p_left)
l_right = row(p_right, tb_right)

layout = column(row(l_above, l_below), row(l_left, l_right))

output_file("toolbars3.html", title="toolbars3.py example")

show(layout)
