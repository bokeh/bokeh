from __future__ import print_function

import os
from math import pi

from bokeh.sampledata.iris import flowers
from bokeh.objects import (
    ColumnDataSource, Glyph, Grid, GridPlot, LinearAxis, Plot,
    DataRange1d, DataRange1d, PanTool, WheelZoomTool
)
from bokeh.glyphs import Circle, Text
from bokeh import session



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

pan = PanTool(dimensions=["x","y"])
zoom = WheelZoomTool(dimensions=["x","y"])

def make_plot(xname, yname, xax=False, yax=False, text=None):
    plot = Plot(
        x_range=xdr, y_range=ydr, data_sources=[source], background_fill="#efe8e2",
        width=250, height=250, border_fill='white', title="", min_border=2, border_symmetry=None)
    if xax:
        xaxis = LinearAxis(plot=plot, dimension=0, location="bottom")
        xgrid = Grid(plot=plot, dimension=0, axis=xaxis)
    if yax:
        yaxis = LinearAxis(plot=plot, dimension=1, location="left")
        ygrid = Grid(plot=plot, dimension=1, axis=yaxis)
    circle = Circle(x=xname, y=yname, fill_color="color", fill_alpha=0.2, size=4, line_color="color")
    circle_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
    )
    plot.renderers.append(circle_renderer)
    plot.tools = [pan, zoom]
    if text:
        text = " ".join(text.split('_'))
        text = Text(
            x={'field':'xcenter', 'units':'screen'},
            y={'field':'ycenter', 'units':'screen'},
            text=[text], angle=pi/4, text_font_style="bold", text_baseline="top",
            text_color="#ffaaaa", text_alpha=0.7, text_align="center", text_font_size="28pt")
        text_renderer = Glyph(
            data_source=text_source,
            xdata_range = xdr,
            ydata_range = ydr,
            glyph = text,
        )
        plot.data_sources.append(text_source)
        plot.renderers.append(text_renderer)
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

sess = session.HTMLFileSession("iris_splom.html")
sess.add_plot(grid)

if __name__ == "__main__":
    sess.save()
    print("Wrote %s" % sess.filename)
    sess.view()
