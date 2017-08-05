import itertools

import numpy as np

from bokeh.plotting import ColumnDataSource, figure, show, output_file
from bokeh.models import HoverTool

TOOLS="crosshair,pan,wheel_zoom,box_zoom,reset,hover,save"

xx, yy = np.meshgrid(range(0,101,4), range(0,101,4))
x = xx.flatten()
y = yy.flatten()
N = len(x)
inds = [str(i) for i in np.arange(N)]
radii = np.random.random(size=N)*0.4 + 1.7
colors = [
    "#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50+2*x, 30+2*y)
]

source = ColumnDataSource(data=dict(
    x=x,
    y=y,
    radius=radii,
    colors=colors,
    foo=list(itertools.permutations("abcdef"))[:N],
    bar=np.random.normal(size=N),
))

p = figure(title="Hoverful Scatter", tools=TOOLS)

p.circle(x='x', y='y', radius='radius', source=source,
         fill_color='colors', fill_alpha=0.6, line_color=None)

p.text(x, y, text=inds, alpha=0.5, text_font_size="5pt",
       text_baseline="middle", text_align="center")

hover = p.select_one(HoverTool).tooltips = [
    ("index", "$index"),
    ("(x,y)", "($x, $y)"),
    ("radius", "@radius"),
    ("fill color", "$color[hex, swatch]:colors"),
    ("foo", "@foo"),
    ("bar", "@bar"),
]

output_file("hover.html", title="hover.py example")

show(p)  # open a browser
