
import os

from bokeh.sampledata import iris
from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, Grid, ColumnDataSource, GlyphRenderer, PanTool, ZoomTool
)
from bokeh.glyphs import Circle
from bokeh import session

colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}

iris['color'] = iris['species'].map(lambda x: colormap[x])

source = ColumnDataSource(
    data=dict(
        petal_length=iris['petal_length'],
        petal_width=iris['petal_width'],
        sepal_length=iris['sepal_length'],
        sepal_width=iris['sepal_width'],
        color=iris['color']
    )
)

xdr = DataRange1d(sources=[source.columns("petal_length")])
ydr = DataRange1d(sources=[source.columns("petal_width")])

circle = Circle(x="petal_length", y="petal_width", fill_color="color", fill_alpha=0.5, radius=5, line_color=None)

glyph_renderer = GlyphRenderer(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], border=80, title="Iris Data")
xaxis = LinearAxis(plot=plot, dimension=0, location="min", 
        axis_label="petal length", bounds=(1,7), major_tick_in=0)
yaxis = LinearAxis(plot=plot, dimension=1, location="min", 
        axis_label="petal width", bounds=(0,2.5), major_tick_in=0)
xgrid = Grid(plot=plot, dimension=0)
ygrid = Grid(plot=plot, dimension=1)

pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
zoomtool = ZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,zoomtool]

sess = session.HTMLFileSession("iris.html")
sess.add(plot, glyph_renderer, xaxis, yaxis, xgrid, ygrid, source, xdr, ydr, pantool, zoomtool)
sess.plotcontext.children.append(plot)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))
print "Wrote iris.html"
try:
    import webbrowser
    webbrowser.open("file://" + os.path.abspath("iris.html"))
except:
    pass
