import numpy as np

from bokeh.io import curdoc, show
from bokeh.models import ColumnDataSource, Grid, HArea, LinearAxis, Plot

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

x_axis = LinearAxis()
plot.add_layout(x_axis, 'below')

y_axis = LinearAxis()
plot.add_layout(y_axis, 'left')

plot.add_layout(Grid(dimension=0, ticker=x_axis.ticker))
plot.add_layout(Grid(dimension=1, ticker=y_axis.ticker))

curdoc().add_root(plot)

show(plot)
