
import os
from math import pi

from bokeh.sampledata.iris import flowers
from bokeh.objects import (
    ColumnDataSource, Glyph, Grid, GridPlot, LinearAxis, Plot,
    DataRange1d, DataRange1d, PanTool, ZoomTool
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
    data=dict(center=[125])
)

xdr = DataRange1d(sources=[source.columns("petal_length", "petal_width", "sepal_length", "sepal_width")])
ydr = DataRange1d(sources=[source.columns("petal_length", "petal_width", "sepal_length", "sepal_width")])

pan = PanTool(dataranges=[xdr,ydr], dimensions=["x","y"])
zoom = ZoomTool(dataranges=[xdr,ydr], dimensions=["x","y"])

def make_plot(xname, yname, xax=False, yax=False, text=None):
    plot = Plot(
        x_range=xdr, y_range=ydr, data_sources=[source], background_fill="#ffeedd",
        width=250, height=250, border_fill='white', title="", border_symmetry="", min_border=2)
    objs = []
    if xax:
        xaxis = LinearAxis(plot=plot, dimension=0, location="bottom")
        objs.append(xaxis)
    if yax:
        yaxis = LinearAxis(plot=plot, dimension=1, location="left")
        objs.append(yaxis)
    xgrid = Grid(plot=plot, dimension=0)
    ygrid = Grid(plot=plot, dimension=1)
    circle = Circle(x=xname, y=yname, fill_color="color", fill_alpha=0.2, radius=2, line_color="color")
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
            x={'field':'center', 'units':'screen'}, 
            y={'field':'center', 'units':'screen'}, 
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
        objs.append(text_renderer)
        objs.append(text_source)
    return plot, objs + [circle_renderer, xgrid, ygrid]

sess = session.HTMLFileSession("iris_splom.html")
attrs = ["petal_length", "petal_width", "sepal_width", "sepal_length"]

plots = []
for y in attrs:
    row = []
    for x in attrs:
        xax = (y == attrs[-1])
        yax = (x == attrs[0])
        text = x if (x==y) else None
        plot, objs = make_plot(x, y, xax, yax, text)
        sess.add(plot, *objs)
        row.append(plot)
    plots.append(row)

grid = GridPlot(children=plots, name="iris_splom")

sess.add(source, xdr, ydr, pan, zoom)
sess.add(grid)
sess.plotcontext.children.append(grid)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))

import webbrowser
webbrowser.open("file://" + os.path.abspath("iris_splom.html"))
