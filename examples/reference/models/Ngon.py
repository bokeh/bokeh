import numpy as np

from bokeh.io import curdoc, show
from bokeh.models import ColumnDataSource, Grid, LinearAxis, Ngon, Plot

N = 9
x = np.linspace(-2, 2, N)
y = x**2
radii = np.linspace(0.1, 0.3, N)
n = np.arange(1, N) + 2

source = ColumnDataSource(dict(x=x, y=y, radii=radii, n=n))

plot = Plot(
    title=None, width=300, height=300,
    min_border=0, toolbar_location=None)

glyph = Ngon(x="x", y="y", radius="radii", n="n", line_color="#3288bd", fill_color="white", line_width=3)
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
