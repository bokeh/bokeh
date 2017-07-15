import numpy as np

from bokeh.models import ColumnDataSource, Range1d, Plot, LinearAxis, Grid
from bokeh.models.glyphs import ImageURL
from bokeh.io import curdoc, show

url = "http://bokeh.pydata.org/en/latest/_static/images/logo.png"
N = 5

source = ColumnDataSource(dict(
    url = [url]*N,
    x1  = np.linspace(  0, 150, N),
    y1  = np.linspace(  0, 150, N),
    w1  = np.linspace( 10,  50, N),
    h1  = np.linspace( 10,  50, N),
    x2  = np.linspace(-50, 150, N),
    y2  = np.linspace(  0, 200, N),
))

xdr = Range1d(start=-100, end=200)
ydr = Range1d(start=-100, end=200)

plot = Plot(
    title=None, x_range=xdr, y_range=ydr, plot_width=300, plot_height=300,
    h_symmetry=False, v_symmetry=False, min_border=0, toolbar_location=None)

image1 = ImageURL(url="url", x="x1", y="y1", w="w1", h="h1", anchor="center")
plot.add_glyph(source, image1)

image2 = ImageURL(url="url", x="x2", y="y2", w=20, h=20, anchor="top_left")
plot.add_glyph(source, image2)

image3 = ImageURL(url=dict(value=url), x=200, y=-100, anchor="bottom_right")
plot.add_glyph(source, image3)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis,'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
