import numpy as np

from bokeh.io import curdoc, show
from bokeh.models import ColumnDataSource, Grid, LinearAxis, Plot, Text

N = 9
x = np.linspace(-2, 2, N)
y = x**2
a = "abcdefghijklmnopqrstuvwxyz"
text = [a[i*3:i*3+3] for i in range(N)]

source = ColumnDataSource(dict(x=x, y=y, text=text))

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = Text(x="x", y="y", text="text", angle=0.3, text_color="#96deb3")
plot.add_glyph(source, glyph)

x_axis = LinearAxis()
plot.add_layout(x_axis, 'below')

y_axis = LinearAxis()
plot.add_layout(y_axis, 'left')

plot.add_layout(Grid(dimension=0, ticker=x_axis.ticker))
plot.add_layout(Grid(dimension=1, ticker=y_axis.ticker))

curdoc().add_root(plot)

show(plot)
