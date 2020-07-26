import numpy as np

from bokeh.io import curdoc, show
from bokeh.models import ColumnDataSource, Grid, LinearAxis, MultiLine, Plot

N = 9
x = np.linspace(-2, 2, N)
y = x**2

xpts = np.array([-.09, -.12, .0, .12,  .09])
ypts = np.array([-.1,   .02, .1, .02, -.1])

source = ColumnDataSource(dict(
        xs=[xpts*(1+i/10.0)+xx for i, xx in enumerate(x)],
        ys=[ypts*(1+i/10.0)+yy for i, yy in enumerate(y)],
    )
)

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = MultiLine(xs="xs", ys="ys", line_color="#8073ac", line_width=2)
plot.add_glyph(source, glyph)

x_axis = LinearAxis()
plot.add_layout(x_axis, 'below')

y_axis = LinearAxis()
plot.add_layout(y_axis, 'left')

plot.add_layout(Grid(dimension=0, ticker=x_axis.ticker))
plot.add_layout(Grid(dimension=1, ticker=y_axis.ticker))

curdoc().add_root(plot)

show(plot)
