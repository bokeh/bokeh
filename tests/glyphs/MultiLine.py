import numpy as np

from bokeh.models import ColumnDataSource, DataRange1d, Plot, LinearAxis, Grid
from bokeh.models.glyphs import MultiLine
from bokeh.io import curdoc, show

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

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(
    title=None, x_range=xdr, y_range=ydr, plot_width=300, plot_height=300,
    h_symmetry=False, v_symmetry=False, min_border=0, toolbar_location=None)

glyph = MultiLine(xs="xs", ys="ys", line_color="#8073ac", line_width=2)
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
