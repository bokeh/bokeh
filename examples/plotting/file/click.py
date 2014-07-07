from __future__ import division

import numpy as np
from six.moves import zip
from collections import OrderedDict
from bokeh.plotting import *
from bokeh.objects import ClickTool

TOOLS="pan,wheel_zoom,box_zoom,reset,click,previewsave"

xx, yy = np.meshgrid(range(0,101,4), range(0,101,4))
x = xx.flatten()
y = yy.flatten()
N = len(x)
inds = [str(i) for i in np.arange(N)]
radii = np.random.random(size=N)*0.4 + 1.7
colors = [
    "#%02x%02x%02x" % (r, g, 150) for r, g in zip(np.floor(50+2*x), np.floor(30+2*y))
]

foo = list(itertools.permutations("abcdef"))[:N]
bar = np.random.normal(size=N)

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

output_file("click.html")

hold()

circle(x, y, radius=radii, source=source, tools=TOOLS,
       fill_color=colors, fill_alpha=0.6,
       line_color=None, Title="Clicky Scatter", name="mystuff")

text(x, y, text=inds, alpha=0.5, text_font_size="5pt",
     text_baseline="middle", text_align="center", angle=0)

# in the broswer console, you will see messages when circles are clicked
click = [t for t in curplot().tools if isinstance(t, ClickTool)][0]
click.names.append("mystuff")

show()  # open a browser
