import numpy as np

from bokeh.models import ColumnDataSource, Plot, LinearAxis, Grid
from bokeh.models.glyphs import Arc
from bokeh.io import curdoc, show

N = 9
x = np.linspace(-2, 2, N)
y = x**2
r = x/15.0+0.3

source = ColumnDataSource(dict(x=x, y=y, r=r))

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = Arc(x="x", y="y", radius="r", start_angle=0.6, end_angle=4.1, line_color="#beaed4", line_width=3)
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
