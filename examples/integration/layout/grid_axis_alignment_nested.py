from __future__ import absolute_import

import numpy as np

from bokeh.plotting import figure, save
from bokeh.layouts import gridplot

items = []

for location in ["above", "right", "left", "below"]:
    coeffs = [10**3, 10**6]
    V = np.arange(10)

    figs = []

    for ycoeff in coeffs:
        row = []
        for xcoeff in coeffs:
            fig = figure(plot_height=200, plot_width=200)
            fig.xaxis[0].formatter.use_scientific = False
            fig.yaxis[0].formatter.use_scientific = False
            fig.xaxis[0].major_label_orientation = "vertical"
            fig.yaxis[0].major_label_orientation = "horizontal"
            fig.scatter(V*xcoeff, V*ycoeff)
            row.append(fig)
        figs.append(row)

    items.append(gridplot(figs, toolbar_location=location))

grid = gridplot(items, ncols=2, merge_tools=False)
save(grid)
