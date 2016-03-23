from __future__ import print_function

from numpy import pi, sin, cos, linspace, tan  # noqa

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Line
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource, Row, Column
)
from bokeh.resources import INLINE

x = linspace(-2 * pi, 2 * pi, 1000)

source = ColumnDataSource(data=dict(
    x=x,
    y1=sin(x),
    y2=cos(x),
    y3=tan(x),
    y4=sin(x) * cos(x),
))


def make_plot(yname, line_color, below_axis=True, left_axis=True):
    """ Returns a tuple (plot, [obj1...objN]); the former can be added
    to a GridPlot, and the latter is added to the plotcontext.
    """
    plot = Plot(
        x_range=DataRange1d(),
        y_range=DataRange1d(),
        min_border=1,
        toolbar_location=None,
        border_fill_color="Coral",
        border_fill_alpha=0.3,
        outline_line_color=None,
        background_fill_color="Thistle",
        background_fill_alpha=0.3,
    )
    if below_axis:
        plot.add_layout(LinearAxis(), 'below')
    else:
        plot.add_layout(LinearAxis(), 'above')
    if left_axis:
        plot.add_layout(LinearAxis(), 'left')
    plot.add_glyph(source, Line(x="x", y=yname, line_color=line_color))
    return plot

plot1 = make_plot("y1", "blue", below_axis=False)
plot2 = make_plot("y2", "red")
plot3 = make_plot("y3", "green", left_axis=False)
plot4 = make_plot("y4", "black", left_axis=False, below_axis=False)

row1 = Row(children=[plot1, plot2])
row2 = Row(children=[plot3, plot4])

doc = Document()
doc.add_root(Column(children=[row1, row2]))

if __name__ == "__main__":
    filename = "grid_layout.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Grid Layout"))
    print("Wrote %s" % filename)
    view(filename)
