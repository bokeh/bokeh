

import numpy as np

from bokeh.document import Document
from bokeh.models import ColumnDataSource, DataRange1d, Plot, LinearAxis, Grid
from bokeh.models.markers import X
from bokeh.plotting import show

N = 9
x = np.linspace(-2, 2, N)
y = x**2
sizes = np.linspace(10, 20, N)

source = ColumnDataSource(dict(x=x, y=y, sizes=sizes))

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(
    title=None, x_range=xdr, y_range=ydr, plot_width=300, plot_height=300,
    h_symmetry=False, v_symmetry=False, min_border=0, toolbar_location=None)

glyph = X(x="x", y="y", size="sizes", line_color="#fdae6b", line_width=2, fill_color=None)
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

doc = Document()
doc.add(plot)

show(plot)
