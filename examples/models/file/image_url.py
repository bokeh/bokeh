import numpy as np

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import ImageURL
from bokeh.models import ColumnDataSource, Plot, LinearAxis, Grid
from bokeh.resources import INLINE

url = "https://bokeh.pydata.org/en/latest/_static/images/logo.png"
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

plot = Plot(match_aspect=True)
plot.title.text = "ImageURL"
plot.toolbar_location = None

image1 = ImageURL(url="url", x="x1", y="y1", w="w1", h="h1", anchor="center", global_alpha=0.2)
plot.add_glyph(source, image1)

image2 = ImageURL(url="url", x="x2", y="y2", w=20, h=20, anchor="top_left", w_units="screen", h_units="screen")
plot.add_glyph(source, image2)

image3 = ImageURL(url=dict(value=url), x=200, y=-100, anchor="bottom_right")
plot.add_glyph(image3)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis,'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

doc = Document( )
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "image_url.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Image URL Example"))
    print("Wrote %s" % filename)
    view(filename)
