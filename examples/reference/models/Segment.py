import numpy as np

from bokeh.io import curdoc, show
from bokeh.models import ColumnDataSource, Grid, LinearAxis, Plot, Segment

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

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = Segment(x0="x", y0="y", x1="xm01", y1="ym01", line_color="#f4a582", line_width=3)
plot.add_glyph(source, glyph)

x_axis = LinearAxis()
plot.add_layout(x_axis, 'below')

y_axis = LinearAxis()
plot.add_layout(y_axis, 'left')

plot.add_layout(Grid(dimension=0, ticker=x_axis.ticker))
plot.add_layout(Grid(dimension=1, ticker=y_axis.ticker))

curdoc().add_root(plot)

show(plot)
