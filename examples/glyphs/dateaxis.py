from __future__ import print_function

from numpy import pi, arange, sin, cos
import numpy as np
import os.path
import time

from bokeh.objects import (Plot, DataRange1d, LinearAxis, DatetimeAxis,
        ColumnDataSource, Glyph, PanTool, WheelZoomTool)
from bokeh.glyphs import Circle
from bokeh import session

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

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
            border=80)
xaxis = DatetimeAxis(plot=plot, dimension=0, location="min")
yaxis = LinearAxis(plot=plot, dimension=1, location="min")

pantool = PanTool(dataranges=[xdr, ydr], dimensions=["width", "height"])
wheelzoomtool = WheelZoomTool(dataranges=[xdr, ydr], dimensions=("width", "height"))

plot.renderers.append(glyph_renderer)
plot.tools = [pantool, wheelzoomtool]

sess = session.HTMLFileSession("dateaxis.html")
sess.add(plot, recursive=True)
sess.plotcontext.children.append(plot)
sess.save(js="absolute", css="absolute")
sess.dumpjson(file="dateaxis.json")
print("Wrote %s" % sess.filename)

if __name__ == "__main__":
    sess.view()
