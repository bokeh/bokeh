import numpy as np

from bokeh.models import ColumnDataSource, DataRange1d, Plot, LinearAxis, Grid
from bokeh.models.glyphs import Bezier
from bokeh.io import curdoc, show

N = 9
x = np.linspace(-2, 2, N)
y = x**2

source = ColumnDataSource(dict(
        x=x,
        y=y,
        xp02=x+0.4,
        xp01=x+0.1,
        xm01=x-0.1,
        yp01=y+0.2,
        ym01=y-0.2,
    )
)

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(
    title=None, x_range=xdr, y_range=ydr, plot_width=300, plot_height=300,
    h_symmetry=False, v_symmetry=False, min_border=0, toolbar_location=None)

glyph = Bezier(x0="x", y0="y", x1="xp02", y1="y", cx0="xp01", cy0="yp01", cx1="xm01", cy1="ym01", line_color="#D95F02", line_width=2)
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
