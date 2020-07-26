import numpy as np

from bokeh.layouts import column, row
from bokeh.plotting import figure, output_file, show

N = 1000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = ["#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50+2*x, 30+2*y)]

TOOLS="hover,crosshair,pan,reset,box_select"

def mkplot(toolbar, x_axis, y_axis):
    p = figure(width=300, height=300, tools=TOOLS, toolbar_location=toolbar, x_axis_location=x_axis, y_axis_location=y_axis)
    p.scatter(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)
    return p

p_lbl = mkplot(toolbar="left",  x_axis="below", y_axis="left")
p_lbr = mkplot(toolbar="left",  x_axis="below", y_axis="right")
p_rbl = mkplot(toolbar="right", x_axis="below", y_axis="left")
p_rbr = mkplot(toolbar="right", x_axis="below", y_axis="right")

p_lal = mkplot(toolbar="left",  x_axis="above", y_axis="left")
p_lar = mkplot(toolbar="left",  x_axis="above", y_axis="right")
p_ral = mkplot(toolbar="right", x_axis="above", y_axis="left")
p_rar = mkplot(toolbar="right", x_axis="above", y_axis="right")

p_abl = mkplot(toolbar="above", x_axis="below", y_axis="left")
p_aal = mkplot(toolbar="above", x_axis="above", y_axis="left")
p_bbl = mkplot(toolbar="below", x_axis="below", y_axis="left")
p_bal = mkplot(toolbar="below", x_axis="above", y_axis="left")

p_abr = mkplot(toolbar="above", x_axis="below", y_axis="right")
p_aar = mkplot(toolbar="above", x_axis="above", y_axis="right")
p_bbr = mkplot(toolbar="below", x_axis="below", y_axis="right")
p_bar = mkplot(toolbar="below", x_axis="above", y_axis="right")

layout = column(
    row(p_lbl, p_lbr, p_lal, p_lar),
    row(p_rbl, p_rbr, p_ral, p_rar),
    row(p_abl, p_aal, p_abr, p_aar),
    row(p_bbl, p_bal, p_bbr, p_bar),
)

output_file("toolbars.html", title="toolbars.py example")

show(layout)
