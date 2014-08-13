
import numpy as np

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.glyphs import ImageURL
from bokeh.objects import ColumnDataSource, Range1d, Plot, Glyph, LinearAxis, Grid
from bokeh.resources import INLINE

url = "http://bokeh.pydata.org/_static/bokeh-transparent.png"
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

plot = Plot(title="ImageURL", data_sources=[source], x_range=xdr, y_range=ydr)

image1 = ImageURL(url="url", x="x1", y="y1", w="w1", h="h1", angle=0.0, anchor="center")
image1_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=image1)
plot.renderers.append(image1_glyph)

image2 = ImageURL(url="url", x="x2", y="y2", w=20, h=20, angle=0.0, anchor="top_left")
image2_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=image2)
plot.renderers.append(image2_glyph)

image3 = ImageURL(url=dict(value=url), x=200, y=-100, angle=0.0, anchor="bottom_right")
image3_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=image3)
plot.renderers.append(image3_glyph)

xaxis = LinearAxis(plot=plot)
plot.below.append(xaxis)
yaxis = LinearAxis(plot=plot)
plot.left.append(yaxis)
xgrid = Grid(plot=plot, dimension=0, ticker=xaxis.ticker)
ygrid = Grid(plot=plot, dimension=1, ticker=yaxis.ticker)

doc = Document( )
doc.add(plot)

if __name__ == "__main__":
    filename = "image_url.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Image URL Example"))
    print("Wrote %s" % filename)
    view(filename)

