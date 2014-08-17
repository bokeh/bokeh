from __future__ import print_function

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.glyphs import Circle
from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, Grid, ColumnDataSource, Glyph, PanTool, WheelZoomTool
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

xdr = DataRange1d(sources=[source.columns("petal_length")])
ydr = DataRange1d(sources=[source.columns("petal_width")])

circle = Circle(x="petal_length", y="petal_width", fill_color="color", fill_alpha=0.2, size=10, line_color="color")

glyph_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], min_border=80, title="Iris Data")
xaxis = LinearAxis(plot=plot, axis_label="petal length", bounds=(1,7), major_tick_in=0)
plot.below.append(xaxis)
yaxis = LinearAxis(plot=plot, axis_label="petal width", bounds=(0,2.5), major_tick_in=0)
plot.left.append(yaxis)
xgrid = Grid(plot=plot, dimension=0, ticker=xaxis.ticker)
ygrid = Grid(plot=plot, dimension=1, ticker=yaxis.ticker)

pantool = PanTool(dimensions=["width", "height"])
wheelzoomtool = WheelZoomTool(dimensions=["width", "height"])

plot.renderers.append(glyph_renderer)
plot.tools = [pantool, wheelzoomtool]

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "iris.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Iris Data Scatter Example"))
    print("Wrote %s" % filename)
    view(filename)
