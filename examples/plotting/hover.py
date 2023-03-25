''' This example displays a hoverful scatter plot of random data points
showing how the hover widget works.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.circle, bokeh.models.ColumnDataSource,
    :keywords: hover, scatter, circles, crosshair, pan, wheel

'''

import itertools

import numpy as np

from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show

TOOLS = "crosshair,pan,wheel_zoom,box_zoom,reset,hover,save"

TOOLTIPS = [
    ("index", "$index"),
    ("(x, y)", "($x, $y)"),
    ("radius", "@radius"),
    ("fill color", "$color[hex, swatch]:colors"),
    ("foo", "@foo"),
    ("bar", "@bar"),
]

N = 26 * 26
x, y = np.mgrid[0:101:4, 0:101:4].reshape((2, N))

source = ColumnDataSource(data=dict(
    x=x,
    y=y,
    radius=np.random.random(N) * 0.4 + 1.7,
    colors=np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype="uint8"),
    foo=list(itertools.permutations("abcdef"))[:N],
    bar=np.random.normal(size=N),
    text=[str(i) for i in np.arange(N)],
))

p = figure(title="Hoverful Scatter", tools=TOOLS, tooltips=TOOLTIPS)

r = p.circle("x", "y", radius="radius", source=source,
             fill_color="colors", fill_alpha=0.6, line_color=None)
p.hover.renderers = [r] # hover only for circles

p.text("x", "y", text="text", source=source, alpha=0.5,
       text_font_size="7px", text_baseline="middle", text_align="center")

show(p)
