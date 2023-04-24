import numpy as np

from bokeh.core.properties import field
from bokeh.io import curdoc, show
from bokeh.models import ColumnDataSource, Grid, LinearAxis, Plot, Range1d, VStrip

N = 9
x0 = np.linspace(-9, 9, N)
x1 = [x + 0.2*(i + 1) for i, x in enumerate(x0)]

source = ColumnDataSource(dict(x0=x0, x1=x1))

plot = Plot(
    y_range=Range1d(start=-10, end=10),
    title=None, width=300, height=300,
    min_border=0, toolbar_location=None,
)

glyph = VStrip(x0=field("x0"), x1=field("x1"), fill_color="#7fc97f")
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, "below")

yaxis = LinearAxis()
plot.add_layout(yaxis, "left")

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
