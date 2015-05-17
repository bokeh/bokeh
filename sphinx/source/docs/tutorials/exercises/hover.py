from __future__ import division

import itertools

import numpy as np

from bokeh.plotting import ColumnDataSource, figure, output_file, show
from bokeh.models import HoverTool

# Create a set of tools to use
TOOLS="pan,wheel_zoom,box_zoom,reset,hover"

xx, yy = np.meshgrid(np.arange(0, 101, 4), np.arange(0, 101, 4))
x = xx.flatten()
y = yy.flatten()
N = len(x)
inds = [str(i) for i in np.arange(N)]
radii = np.random.random(size=N)*0.4 + 1.7
colors = [
    "#%02x%02x%02x" % (r, g, 150) for r, g in zip(np.floor(50+2*x), np.floor(30+2*y))
]

# EXERCISE: create a new data field for the hover tool to interrogate. It can be
# anything you like, but it needs to have the same length as x, y, etc.

# We need to put these data into a ColumnDataSource
source = ColumnDataSource(
    data=dict(
        x=x,
        y=y,
        radius=radii,
        colors=colors,
        # your columns here
    )
)

# EXERCISE: output static HTML file

p = figure(title="Hoverful Scatter", tools=TOOLS)

# This is identical to the scatter exercise, but adds the 'source' parameter
p.circle(x, y, radius=radii, source=source,
         fill_color=colors, fill_alpha=0.6, line_color=None)

# EXERCISE (optional) add a `text` renderer to display the index of each circle
# inside the circle

# EXERCISE: try other "marker-like" renderers besides `circle`

# We want to add some fields for the hover tool to interrogate, but first we
# have to get ahold of the tool. We can use the 'select' method to do that.
hover = p.select(dict(type=HoverTool))

# EXERCISE: add some new tooltip (name, value) pairs. Variables from the
# data source are available with a "@" prefix, e.g., "@x" will display the
# x value under the cursor. There are also some special known values that
# start with "$" symbol:
#   - $index     index of selected point in the data source
#   - $x, $y     "data" coordinates under cursor
#   - $sx, $sy   canvas coordinates under cursor
#   - $color     color data from data source, syntax: $color[options]:field_name
# NOTE: tooltips will show up in the order they are in the list
hover.tooltips = [
    # add to this
    ("index", "$index"),
]

show(p)
