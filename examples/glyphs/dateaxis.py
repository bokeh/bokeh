from __future__ import print_function

from numpy import pi, arange, sin
import numpy as np
import time

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.glyphs import Circle
from bokeh.objects import (Plot, DataRange1d, LinearAxis, DatetimeAxis,
        ColumnDataSource, Glyph, PanTool, WheelZoomTool)
from bokeh.resources import INLINE

x = arange(-2 * pi, 2 * pi, 0.1)
y = sin(x)

# Create an array of times, starting at the current time, and extending
# for len(x) number of hours.
times = np.arange(len(x)) * 3600000 + time.time()

source = ColumnDataSource(
    data=dict(x=x, y=y, times=times)
)

xdr = DataRange1d(sources=[source.columns("times")])
ydr = DataRange1d(sources=[source.columns("y")])

circle = Circle(x="times", y="y", fill_color="red", size=5, line_color="black")

glyph_renderer = Glyph(
    data_source=source,
    xdata_range=xdr,
    ydata_range=ydr,
    glyph=circle,
)

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], min_border=80)
xaxis = DatetimeAxis(plot=plot)
plot.below.append(xaxis)
yaxis = LinearAxis(plot=plot)
plot.left.append(yaxis)

pantool = PanTool(dimensions=["width", "height"])
wheelzoomtool = WheelZoomTool(dimensions=["width", "height"])

plot.renderers.append(glyph_renderer)
plot.tools = [pantool, wheelzoomtool]

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "dateaxis.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Date Axis Example"))
    print("Wrote %s" % filename)
    view(filename)
