import numpy as np

from bokeh.plotting import figure, show, output_file
from bokeh.layouts import row, column, gridplot

N = 1000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = ["#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50+2*x, 30+2*y)]

TOOLS="hover,crosshair,pan,wheel_zoom,zoom_in,zoom_out,box_zoom,undo,redo,reset,tap,save,box_select,poly_select,lasso_select"

def mkplot(xaxis="below", yaxis="left"):
    p = figure(width=300, height=300, tools=TOOLS, x_axis_location=xaxis, y_axis_location=yaxis)
    p.scatter(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)
    return p

def mkgrid(plots, location):
    return gridplot(plots, plot_width=300, plot_height=300, toolbar_location=location)

l_al = mkgrid([[mkplot(), mkplot()], [mkplot(), mkplot()]], "above")
l_ar = mkgrid([[mkplot(), mkplot()], [mkplot(), mkplot()]], "below")
l_bl = mkgrid([[mkplot(), mkplot()], [mkplot(), mkplot()]], "left")
l_br = mkgrid([[mkplot(), mkplot()], [mkplot(), mkplot()]], "right")

layout = column(row(l_al, l_ar), row(l_bl, l_br))

output_file("toolbars2.html", title="toolbars2.py example")

show(layout)
