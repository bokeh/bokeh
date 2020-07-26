import numpy as np

from bokeh.layouts import gridplot
from bokeh.plotting import figure, save

coeffs = [10**0, 10**3, 10**6, 10**9]
V = np.arange(10, dtype="int64")

figs = []

for ycoeff in coeffs:
    row = []
    for xcoeff in coeffs:
        fig = figure(plot_height=200, plot_width=200)
        fig.x_axis.formatter.use_scientific = False
        fig.y_axis.formatter.use_scientific = False
        fig.x_axis.major_label_orientation = "vertical"
        fig.y_axis.major_label_orientation = "horizontal"
        fig.scatter(V*xcoeff, V*ycoeff)
        row.append(fig)
    figs.append(row)

grid = gridplot(figs, toolbar_location=None)

save(grid)
