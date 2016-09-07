import numpy as np

from bokeh.models import ColumnDataSource, DataRange1d, Plot, LinearAxis, Grid
from bokeh.models.glyphs import Segment
from bokeh.io import curdoc, show

N = 9
x = np.linspace(-2, 2, N)
y = x**2

source = ColumnDataSource(dict(
        x=x,
        y=y,
        xm01=x-x**3/10 + 0.3,
        ym01=y-x**2/10 + 0.5,
    )
)

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(
    title=None, x_range=xdr, y_range=ydr, plot_width=300, plot_height=300,
    h_symmetry=False, v_symmetry=False, min_border=0, toolbar_location=None)

glyph = Segment(x0="x", y0="y", x1="xm01", y1="ym01", line_color="#f4a582", line_width=3)
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
