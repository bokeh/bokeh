from __future__ import print_function

from numpy import pi, sin, cos, tan
import numpy as np

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.glyphs import Line
from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource,
    Glyph, PanTool, WheelZoomTool, GridPlot
)
from bokeh.resources import INLINE

x = np.linspace(-2*pi, 2*pi, 1000)

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
    to a GridPlot, and the latter is added to the plotcontext.
    """
    if xdr is None:
        xdr = DataRange1d(sources=[source.columns(xname)])
    if ydr is None:
        ydr = DataRange1d(sources=[source.columns(yname)])
    plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], min_border=50)
    xaxis = LinearAxis(plot=plot)
    plot.below.append(xaxis)
    yaxis = LinearAxis(plot=plot)
    plot.left.append(yaxis)
    pantool = PanTool(dimensions=["width", "height"])
    wheelzoomtool = WheelZoomTool(dimensions=["width", "height"])
    renderer = Glyph(
            data_source = source,
            xdata_range = xdr,
            ydata_range = ydr,
            glyph = Line(x=xname, y=yname, line_color=line_color),
            )
    plot.renderers.append(renderer)
    plot.tools = [pantool, wheelzoomtool]
    return plot

plot1 = make_plot(source, "x", "y1", "blue")
plot2 = make_plot(source, "x", "y2", "red", xdr=plot1.x_range)
plot3 = make_plot(source, "x", "y3", "green")
plot4 = make_plot(source, "x", "y4", "black")

grid = GridPlot(children=[[plot1, plot2], [plot3, plot4]])

doc = Document()
doc.add(grid)

if __name__ == "__main__":
    filename = "grid.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Grid Plot Example"))
    print("Wrote %s" % filename)
    view(filename)
