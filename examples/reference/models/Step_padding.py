"""Example demonstrating pad_before and pad_after options for Step glyph.

This example shows how step plots can extend beyond the first and last data
points using the pad_before and pad_after parameters. This is particularly
useful for data like ADC samples where each point represents a time duration.
"""
import numpy as np

from bokeh.io import show
from bokeh.layouts import gridplot
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure

# Sample data - 5 points at x = [1, 2, 3, 4, 5]
x = [1, 2, 3, 4, 5]
y = [2, 5, 3, 6, 4]

source = ColumnDataSource(dict(x=x, y=y))

# Create a 3x4 grid of plots showing different combinations of mode, pad_before, and pad_after
modes = ["before", "after", "center"]
pad_configs = [
    (0, 0),
    (0, 0.75),
    (0.25, 0),
    (0.25, 0.75),
]
colors = {"before": "blue", "after": "green", "center": "red"}

plots = []
for mode in modes:
    row = []
    for pad_before, pad_after in pad_configs:
        p = figure(width=250, height=200, 
                   title=f"mode={mode}, pad_before={pad_before}, pad_after={pad_after}",
                   x_range=(0.5, 6), y_range=(1, 7))
        p.step(x="x", y="y", source=source, 
               mode=mode, 
               pad_before=pad_before, 
               pad_after=pad_after,
               line_color=colors[mode], line_width=2)
        p.scatter(x="x", y="y", source=source, size=8, color="black")
        row.append(p)
    plots.append(row)

grid = gridplot(plots)
show(grid)
