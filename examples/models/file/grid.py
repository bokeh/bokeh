from __future__ import print_function

from numpy import pi, sin, cos, linspace, tan

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.layouts import gridplot
from bokeh.models.glyphs import Line
from bokeh.models import Plot, DataRange1d, LinearAxis, ColumnDataSource, PanTool, WheelZoomTool
from bokeh.resources import INLINE

x = linspace(-2*pi, 2*pi, 1000)

source = ColumnDataSource(data = dict(
        x = x,
        y1 = sin(x),
        y2 = cos(x),
        y3 = tan(x),
        y4 = sin(x) * cos(x),
    )
)

def make_plot(source, xname, yname, line_color, xdr=None, ydr=None):
    """ Returns a tuple (plot, [obj1...objN]); the former can be added
    to a gridplot
    """
    if xdr is None: xdr = DataRange1d()
    if ydr is None: ydr = DataRange1d()

    plot = Plot(x_range=xdr, y_range=ydr, min_border=50)

    plot.add_layout(LinearAxis(), 'below')
    plot.add_layout(LinearAxis(), 'left')

    plot.add_glyph(source, Line(x=xname, y=yname, line_color=line_color))

    plot.add_tools(PanTool(), WheelZoomTool())

    return plot

plot1 = make_plot(source, "x", "y1", "blue")
plot2 = make_plot(source, "x", "y2", "red", xdr=plot1.x_range)
plot3 = make_plot(source, "x", "y3", "green")
plot4 = make_plot(source, "x", "y4", "black")

grid = gridplot([[plot1, plot2], [plot3, plot4]], plot_width=300, plot_height=300)

doc = Document()
doc.add_root(grid)

if __name__ == "__main__":
    doc.validate()
    filename = "grid.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Grid Plot Example"))
    print("Wrote %s" % filename)
    view(filename)
