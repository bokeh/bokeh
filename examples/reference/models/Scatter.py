import numpy as np

from bokeh.core.enums import MarkerType
from bokeh.models import ColumnDataSource, Plot, LinearAxis, Grid
from bokeh.models.markers import Scatter
from bokeh.io import curdoc, show

N = len(MarkerType)
x = np.linspace(-2, 2, N)
y = x**2
markers = list(MarkerType)

source = ColumnDataSource(dict(x=x, y=y, markers=markers))

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = Scatter(x="x", y="y", size=20, fill_color="#74add1", marker="markers")
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
