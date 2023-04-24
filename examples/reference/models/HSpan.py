import numpy as np

from bokeh.core.properties import field
from bokeh.io import curdoc, show
from bokeh.models import ColumnDataSource, Grid, HSpan, LinearAxis, Plot, Range1d

N = 9
y = np.linspace(-9, 9, N)
w = [1 + 0.25*i for i in range(0, 9)]

source = ColumnDataSource(dict(y=y, w=w))

plot = Plot(
    x_range=Range1d(start=-10, end=10),
    title=None, width=300, height=300,
    min_border=0, toolbar_location=None,
)

glyph = HSpan(y=field("y"), line_width=field("w"), line_color="#7fc97f")
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, "below")

yaxis = LinearAxis()
plot.add_layout(yaxis, "left")

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
