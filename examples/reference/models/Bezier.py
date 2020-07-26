import numpy as np

from bokeh.io import curdoc, show
from bokeh.models import Bezier, ColumnDataSource, Grid, LinearAxis, Plot

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

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = Bezier(x0="x", y0="y", x1="xp02", y1="y", cx0="xp01", cy0="yp01", cx1="xm01", cy1="ym01", line_color="#d95f02", line_width=2)
plot.add_glyph(source, glyph)

x_axis = LinearAxis()
plot.add_layout(x_axis, 'below')

y_axis = LinearAxis()
plot.add_layout(y_axis, 'left')

plot.add_layout(Grid(dimension=0, ticker=x_axis.ticker))
plot.add_layout(Grid(dimension=1, ticker=y_axis.ticker))

curdoc().add_root(plot)

show(plot)
