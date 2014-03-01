from __future__ import division

import numpy as np
from six.moves import zip
from collections import OrderedDict
from bokeh.plotting import *
from bokeh.objects import HoverTool, Range1d

# Create a set of tools to use
TOOLS="pan,wheel_zoom,box_zoom,reset,hover"

xx, yy = np.meshgrid(xrange(0,101,4), xrange(0,101,4))
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
foo = list(itertools.permutations("abcdef"))[:N]
bar = np.random.normal(size=N)

# We need to put these data into a ColumnDataSource
source = ColumnDataSource(
    data=dict(
        x=x,
        y=y,
        radius=radii,
        colors=colors,
        foo=foo,
        bar=bar,
    )
)

# EXERCISE: output static HTML file
output_file("scatter.html")

hold()

# This is identical to the scatter exercise, but adds the 'source' parameter
circle(x, y, radius=radii, source=source, tools=TOOLS,
       fill_color=colors, fill_alpha=0.6,
       line_color=None, Title="Hoverful Scatter")

# EXERCISE (optional) add a `text` renderer to display the index of each circle
# inside the circle
text(x, y, text=inds, alpha=0.5, text_font_size="5pt",
     text_baseline="middle", text_align="center", angle=0)

# EXERCISE: try other "marker-like" renderers besides `circle`

# We want to add some fields for the hover tool to interrogate, but first we
# have to get ahold of the tool. This will be made easier in future releases.
hover = [t for t in curplot().tools if isinstance(t, HoverTool)][0]

# EXERCISE: add some new tooltip (name, value) pairs. Variables from the
# data source are available with a "@" prefix, e.g., "@x" will display the
# x value under the cursor. There are also some special known values that
# start with "$" symbol:
#   - $index     index of selected point in the data source
#   - $x, $y     "data" coordinates under cursor
#   - $sx, $sy   canvas coordinates under cursor
#   - $color     color data from data source, syntax: $color[options]:field_name
# NOTE: we use an OrderedDict to preserve the order in the displayed tooltip
hover.tooltips = OrderedDict([
    # add to this
    ("index", "$index"),
    ("(x,y)", "($x, $y)"),
    ("radius", "@radius"),
    ("fill color", "$color[hex, swatch]:fill_color"),
    ("foo", "@foo"),
    ("bar", "@bar"),
])

show()  # open a browser
