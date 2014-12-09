from __future__ import division

import numpy as np
from six.moves import zip

from bokeh.plotting import *
from bokeh.models import TapTool

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

output_file("tap.html")

TOOLS="crosshair,pan,wheel_zoom,box_zoom,reset,tap,previewsave"

p = figure(title="Tappy Scatter", tools=TOOLS)

p.circle(x, y, radius=radii, source=source,
       fill_color=colors, fill_alpha=0.6,
       line_color=None, name="mystuff")

p.text(x, y, text=inds, alpha=0.5, text_font_size="5pt",
     text_baseline="middle", text_align="center")

# in the broswer console, you will see messages when circles are clicked
tool = p.select(dict(type=TapTool))[0]
tool.names.append("mystuff")

show(p)  # open a browser
