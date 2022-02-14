''' A scatter plot matrix (SPLOM) chart using `Fisher's Iris dataset`_. This
example demonstrates sharing ranged between plots to achieve linked panning.

.. note::
    This example is maintained for historical compatibility. Please consider
    `alternatives to Iris`_, such as :ref:`sampledata_penguins`.

.. bokeh-example-metadata::
    :sampledata: iris
    :apis: bokeh.models.glyphs.Circle, bokeh.models.sources.ColumnDataSource, bokeh.models.plots.Plot, bokeh.models.axes.LinearAxis, bokeh.models.plots.Plot, bokeh.models.ranges.DataRange1d # noqa: E501
    :refs: :ref:`userguide_interaction_linked` > :ref:`userguide_interaction_linked_panning`
    :keywords: models, scatter, splom

.. _Fisher's Iris dataset: https://en.wikipedia.org/wiki/Iris_flower_data_set
.. _alternatives to Iris: https://www.meganstodel.com/posts/no-to-iris/

'''
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.layouts import gridplot
from bokeh.models import (BasicTicker, Circle, ColumnDataSource, DataRange1d,
                          Grid, LinearAxis, PanTool, Plot, WheelZoomTool)
from bokeh.resources import INLINE
from bokeh.sampledata.iris import flowers
from bokeh.util.browser import view

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

xdr = DataRange1d(bounds=None)
ydr = DataRange1d(bounds=None)

def make_plot(xname, yname, xax=False, yax=False):
    mbl = 40 if yax else 0
    mbb = 40 if xax else 0
    plot = Plot(
        x_range=xdr, y_range=ydr, background_fill_color="#efe8e2",
        border_fill_color='white', width=200 + mbl, height=200 + mbb,
        min_border_left=2+mbl, min_border_right=2, min_border_top=2, min_border_bottom=2+mbb)

    circle = Circle(x=xname, y=yname, fill_color="color", fill_alpha=0.2, size=4, line_color="color")
    r = plot.add_glyph(source, circle)

    xdr.renderers.append(r)
    ydr.renderers.append(r)

    xticker = BasicTicker()
    if xax:
        xaxis = LinearAxis()
        xaxis.axis_label = xname
        plot.add_layout(xaxis, 'below')
        xticker = xaxis.ticker
    plot.add_layout(Grid(dimension=0, ticker=xticker))

    yticker = BasicTicker()
    if yax:
        yaxis = LinearAxis()
        yaxis.axis_label = yname
        yaxis.major_label_orientation = 'vertical'
        plot.add_layout(yaxis, 'left')
        yticker = yaxis.ticker
    plot.add_layout(Grid(dimension=1, ticker=yticker))

    plot.add_tools(PanTool(), WheelZoomTool())

    return plot

xattrs = ["petal_length", "petal_width", "sepal_width", "sepal_length"]
yattrs = list(reversed(xattrs))
plots = []

for y in yattrs:
    row = []
    for x in xattrs:
        xax = (y == yattrs[-1])
        yax = (x == xattrs[0])
        plot = make_plot(x, y, xax, yax)
        row.append(plot)
    plots.append(row)

grid = gridplot(plots)

doc = Document()
doc.add_root(grid)

if __name__ == "__main__":
    doc.validate()
    filename = "iris_splom.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Iris Data SPLOM"))
    print("Wrote %s" % filename)
    view(filename)
