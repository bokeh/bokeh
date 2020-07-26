import numpy as np

from bokeh.io import curdoc, show
from bokeh.models import Arc, ColumnDataSource, Grid, LinearAxis, Plot

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

x_axis = LinearAxis()
plot.add_layout(x_axis, 'below')

y_axis = LinearAxis()
plot.add_layout(y_axis, 'left')

plot.add_layout(Grid(dimension=0, ticker=x_axis.ticker))
plot.add_layout(Grid(dimension=1, ticker=y_axis.ticker))

curdoc().add_root(plot)

show(plot)
