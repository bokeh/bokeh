from __future__ import print_function

from math import pi

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Circle, Text
from bokeh.models import (
    BasicTicker, ColumnDataSource, Grid, GridPlot, LinearAxis,
    DataRange1d, PanTool, Plot, WheelZoomTool
)
from bokeh.resources import INLINE
from bokeh.sampledata.iris import flowers

colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}

flowers['color'] = flowers['species'].map(lambda x: colormap[x])


source = ColumnDataSource(
    data=dict(
        petal_length=flowers['petal_length'],
        petal_width=flowers['petal_width'],
        sepal_length=flowers['sepal_length'],
        sepal_width=flowers['sepal_width'],
        color=flowers['color']
    )
)

text_source = ColumnDataSource(
    data=dict(xcenter=[125], ycenter=[135])
)

xdr = DataRange1d(sources=[source.columns("petal_length", "petal_width", "sepal_length", "sepal_width")])
ydr = DataRange1d(sources=[source.columns("petal_length", "petal_width", "sepal_length", "sepal_width")])

def make_plot(xname, yname, xax=False, yax=False, text=None):
    plot = Plot(
        x_range=xdr, y_range=ydr, background_fill="#efe8e2",
        border_fill='white', title="", min_border=2, h_symmetry=False, v_symmetry=False,
        plot_width=250, plot_height=250)

    circle = Circle(x=xname, y=yname, fill_color="color", fill_alpha=0.2, size=4, line_color="color")
    plot.add_glyph(source, circle)

    xticker = BasicTicker()
    if xax:
        xaxis = LinearAxis()
        plot.add_layout(xaxis, 'below')
        xticker = xaxis.ticker
    plot.add_layout(Grid(dimension=0, ticker=xticker))

    yticker = BasicTicker()
    if yax:
        yaxis = LinearAxis()
        plot.add_layout(yaxis, 'left')
        yticker = yaxis.ticker
    plot.add_layout(Grid(dimension=1, ticker=yticker))

    plot.add_tools(PanTool(), WheelZoomTool())

    if text:
        text = " ".join(text.split('_'))
        text = Text(
            x={'field':'xcenter', 'units':'screen'},
            y={'field':'ycenter', 'units':'screen'},
            text=[text], angle=pi/4, text_font_style="bold", text_baseline="top",
            text_color="#ffaaaa", text_alpha=0.7, text_align="center", text_font_size="28pt"
        )
        plot.add_glyph(text_source, text)

    return plot

xattrs = ["petal_length", "petal_width", "sepal_width", "sepal_length"]
yattrs = list(reversed(xattrs))
plots = []

for y in yattrs:
    row = []
    for x in xattrs:
        xax = (y == yattrs[-1])
        yax = (x == xattrs[0])
        text = x if (x==y) else None
        plot = make_plot(x, y, xax, yax, text)
        row.append(plot)
    plots.append(row)

grid = GridPlot(children=plots, title="iris_splom")

doc = Document()
doc.add(grid)

if __name__ == "__main__":
    filename = "iris_splom.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Iris Data SPLOM"))
    print("Wrote %s" % filename)
    view(filename)
