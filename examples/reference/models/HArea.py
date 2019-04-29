import numpy as np

from bokeh.models import ColumnDataSource, Plot, LinearAxis, Grid
from bokeh.models.glyphs import HArea
from bokeh.io import curdoc, show

N = 30
y = np.linspace(-2, 3, N)
x1 = np.zeros(N)
x2 = 10 - y**2

source = ColumnDataSource(dict(x1=x1, x2=x2, y=y))

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = HArea(x1="x1", x2="x2", y="y", fill_color="#f46d43")
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
