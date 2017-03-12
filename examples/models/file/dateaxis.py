from __future__ import print_function

from numpy import pi, arange, sin
import numpy as np
import time

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Circle
from bokeh.models import (
    Plot, DataRange1d, DatetimeAxis,
    ColumnDataSource, PanTool, WheelZoomTool
)
from bokeh.resources import INLINE

x = arange(-2 * pi, 2 * pi, 0.1)
y = sin(x)

# Create an array of times, starting at the current time, and extending
# for len(x) number of hours.
times = np.arange(len(x)) * 3600000 + time.time()

source = ColumnDataSource(
    data=dict(x=x, y=y, times=times)
)

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(x_range=xdr, y_range=ydr, min_border=80)

circle = Circle(x="times", y="y", fill_color="red", size=5, line_color="black")
plot.add_glyph(source, circle)

plot.add_layout(DatetimeAxis(), 'below')
plot.add_layout(DatetimeAxis(), 'left')

plot.add_tools(PanTool(), WheelZoomTool())

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "dateaxis.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Date Axis Example"))
    print("Wrote %s" % filename)
    view(filename)
