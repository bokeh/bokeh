from __future__ import print_function

from numpy import pi, arange, sin, cos, tan
import numpy as np
import os.path

from bokeh.objects import (Plot, DataRange1d, LinearAxis,
    ColumnDataSource, Glyph, PanTool, WheelZoomTool, GridPlot)
from bokeh.glyphs import Line
from bokeh import session

x = np.linspace(-2*pi, 2*pi, 1000)

source = ColumnDataSource(data = dict(
            x = x,
            y1 = sin(x),
            y2 = cos(x),
            y3 = tan(x),
            y4 = sin(x) * cos(x),
    )
)

def make_plot(source, xname, yname, linecolor, xdr=None, ydr=None):
    """ Returns a tuple (plot, [obj1...objN]); the former can be added
    to a GridPlot, and the latter is added to the plotcontext.
    """
    if xdr is None:
        xdr = DataRange1d(sources=[source.columns(xname)])
    if ydr is None:
        ydr = DataRange1d(sources=[source.columns(yname)])
    plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
            border=50)
    xaxis = LinearAxis(plot=plot, dimension=0, location="bottom")
    yaxis = LinearAxis(plot=plot, dimension=1, location="left")
    pantool = PanTool(dataranges=[xdr,ydr], dimensions=["width","height"])
    wheelzoomtool = WheelZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))
    renderer = Glyph(
            data_source = source,
            xdata_range = xdr,
            ydata_range = ydr,
            glyph = Line(x=xname, y=yname, linecolor=linecolor),
            )
    plot.renderers.append(renderer)
    plot.tools = [pantool, wheelzoomtool]
    return plot

plot1 = make_plot(source, "x", "y1", "blue")
plot2 = make_plot(source, "x", "y2", "red", xdr=plot1.x_range)
plot3 = make_plot(source, "x", "y3", "green")
plot4 = make_plot(source, "x", "y4", "black")

grid = GridPlot(children=[[plot1, plot2], [plot3, plot4]])

sess = session.HTMLFileSession("grid.html")
sess.add(grid, recursive=True)
sess.plotcontext.children.append(grid)
sess.save(js="absolute", css="absolute")
print("Wrote %s" % sess.filename)

if __name__ == "__main__":
    sess.view()
