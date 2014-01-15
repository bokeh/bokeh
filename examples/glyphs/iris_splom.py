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
    data=dict(xcenter=[125], ycenter=[145])
)

xdr = DataRange1d(sources=[source.columns("petal_length", "petal_width", "sepal_length", "sepal_width")])
ydr = DataRange1d(sources=[source.columns("petal_length", "petal_width", "sepal_length", "sepal_width")])

pan = PanTool(dataranges=[xdr,ydr], dimensions=["x","y"])
zoom = WheelZoomTool(dataranges=[xdr,ydr], dimensions=["x","y"])

def make_plot(xname, yname, xax=False, yax=False, text=None):
    plot = Plot(
        x_range=xdr, y_range=ydr, data_sources=[source], background_fill="#ffeedd",
        width=250, height=250, border_fill='white', title="", border_symmetry="", min_border=2)
    if xax:
        xaxis = LinearAxis(plot=plot, dimension=0, location="bottom")
    if yax:
        yaxis = LinearAxis(plot=plot, dimension=1, location="left")
    xgrid = Grid(plot=plot, dimension=0)
    ygrid = Grid(plot=plot, dimension=1)
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
            text=text, angle=pi/4, text_font_style="bold", text_baseline="top",
            text_color="#ffaaaa", text_alpha=0.5, text_align="center", text_font_size="28pt")
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

grid = GridPlot(children=plots, name="iris_splom")

sess = session.HTMLFileSession("iris_splom.html")
sess.add(grid, recursive=True)
sess.plotcontext.children.append(grid)
sess.save(js="absolute", css="absolute")
print("Wrote %s" % sess.filename)

if __name__ == "__main__":
    sess.view()
