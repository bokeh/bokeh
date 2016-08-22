from __future__ import print_function

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Circle
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, Grid, ColumnDataSource, PanTool, WheelZoomTool, Title
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

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(x_range=xdr, y_range=ydr, plot_width=800, plot_height=400)
plot.title.text = "Iris Data"

circle = Circle(
    x="petal_length", y="petal_width", size=10,
    fill_color="color", fill_alpha=0.2, line_color="color"
)
plot.add_glyph(source, circle)

xaxis = LinearAxis(axis_label="petal length", major_tick_in=0)
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis(axis_label="petal width", major_tick_in=0)
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

plot.add_tools(PanTool(), WheelZoomTool())

# Add a caption as a title placed in "below" layout panel.
msg = """The Iris flower data set, or Fisher's Iris data set, is a multivariate data set introduced by Ronald Fisher in his 1936 paper."""
caption = Title(text=msg, align='left', text_font_size='10pt')
plot.add_layout(caption, 'below')

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "iris.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Iris Data Scatter Example"))
    print("Wrote %s" % filename)
    view(filename)
