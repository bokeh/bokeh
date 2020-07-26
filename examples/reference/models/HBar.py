import numpy as np

from bokeh.io import curdoc, show
from bokeh.models import ColumnDataSource, Grid, HBar, LinearAxis, Plot

N = 9
y = np.linspace(-2, 2, N)
x = y**2

source = ColumnDataSource(dict(y=y, right=x,))

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = HBar(y="y", right="right", left=0, height=0.5, fill_color="#b3de69")
plot.add_glyph(source, glyph)

x_axis = LinearAxis()
plot.add_layout(x_axis, 'below')

y_axis = LinearAxis()
plot.add_layout(y_axis, 'left')

plot.add_layout(Grid(dimension=0, ticker=x_axis.ticker))
plot.add_layout(Grid(dimension=1, ticker=y_axis.ticker))

curdoc().add_root(plot)

show(plot)
