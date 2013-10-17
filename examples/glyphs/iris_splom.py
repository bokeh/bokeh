
import os

from bokeh.sampledata.iris import flowers
from bokeh.objects import (
    ColumnDataSource, GlyphRenderer, Grid, GridPlot, LinearAxis, Plot, DataRange1d, Range1d
)
from bokeh.glyphs import Circle
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

#xdr = DataRange1d(sources=[source.columns(["petal_length", "petal_width", "sepal_width", "sepal_length"])])
#ydr = DataRange1d(sources=[source.columns(["petal_length", "petal_width", "sepal_width", "sepal_length"])])
xdr = Range1d(start=-1, end=9)
ydr = Range1d(start=-1, end=9)
print xdr.start

def make_plot(xname, yname):
    plot = Plot(
        x_range=xdr, y_range=ydr, data_sources=[source],
        width=250, height=250, border_fill='white', title="")
    xaxis = LinearAxis(plot=plot, dimension=0, location="bottom", axis_line_alpha=0)
    yaxis = LinearAxis(plot=plot, dimension=1, location="left", axis_line_alpha=0)
    xgrid = Grid(plot=plot, dimension=0)
    ygrid = Grid(plot=plot, dimension=1)
    circle = Circle(x=xname, y=yname, fill_color="color", fill_alpha=0.2, radius=2, line_color="color")
    circle_renderer = GlyphRenderer(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
    )
    plot.renderers.append(circle_renderer)
    return plot, (circle_renderer, xaxis, yaxis, xgrid, ygrid)

sess = session.HTMLFileSession("iris_splom.html")
attrs = ["petal_length", "petal_width", "sepal_width", "sepal_length"]

plots = []
for attr1 in attrs:
    row = []
    for attr2 in attrs:
        plot, objs = make_plot(attr1, attr2)
        sess.add(plot, *objs)
        row.append(plot)
    plots.append(row)

grid = GridPlot(children=plots)

sess.add(source, xdr, ydr)
sess.add(grid)
sess.plotcontext.children.append(grid)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))

try:
    import webbrowser
    webbrowser.open("file://" + os.path.abspath("iris_splom.html"))
except:
    pass
