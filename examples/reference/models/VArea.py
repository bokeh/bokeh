import numpy as np

from bokeh.models import ColumnDataSource, Plot, LinearAxis, Grid
from bokeh.models.glyphs import VArea
from bokeh.io import curdoc, show

N = 30
x = np.linspace(-2, 3, N)
y1 = np.zeros(N)
y2 = 10 - x**2

source = ColumnDataSource(dict(x=x, y1=y1, y2=y2))

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = VArea(x="x", y1="y1", y2="y2", fill_color="#f46d43")
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
