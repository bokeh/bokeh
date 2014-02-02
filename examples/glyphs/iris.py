from __future__ import print_function

import os

from bokeh.sampledata.iris import flowers
from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, Grid, ColumnDataSource, Glyph, PanTool, WheelZoomTool
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

xdr = DataRange1d(sources=[source.columns("petal_length")])
ydr = DataRange1d(sources=[source.columns("petal_width")])

circle = Circle(x="petal_length", y="petal_width", fill_color="color", fill_alpha=0.2, size=10, line_color="color")

glyph_renderer = Glyph(
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
wheelzoomtool = WheelZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,wheelzoomtool]

sess = session.HTMLFileSession("iris.html")
sess.add(plot, recursive=True)
sess.plotcontext.children.append(plot)
sess.save(js="absolute", css="absolute")
print("Wrote %s" % sess.filename)

if __name__ == "__main__":
    sess.view()
