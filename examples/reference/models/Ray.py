import numpy as np

from bokeh.models import ColumnDataSource, Plot, LinearAxis, Grid
from bokeh.models.glyphs import Ray
from bokeh.io import curdoc, show

N = 9
x = np.linspace(-2, 2, N)
y = x**2
l = x*5 + 25

source = ColumnDataSource(dict(x=x, y=y, l=l))

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = Ray(x="x", y="y", length="l", angle=-2.0, line_color="#fb8072", line_width=3)
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
