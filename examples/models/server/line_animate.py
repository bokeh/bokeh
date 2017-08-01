from __future__ import print_function

from numpy import pi, sin, cos, linspace

from bokeh.client import push_session
from bokeh.driving import count
from bokeh.io import curdoc
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, Range1d,
    ColumnDataSource, PanTool, WheelZoomTool, Line
)

x = linspace(-6*pi, 6*pi, 1000)
y = sin(x)
z = cos(x)

source = ColumnDataSource(data=dict(x=x, y=y, z=z))

plot = Plot(x_range=Range1d(-2*pi, 2*pi), y_range=DataRange1d(), min_border=50)

line_glyph = Line(x="x", y="y", line_color="blue")
plot.add_glyph(source, line_glyph)

line_glyph2 = Line(x="x", y="z", line_color="red")
plot.add_glyph(source, line_glyph2)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

plot.add_tools(PanTool(), WheelZoomTool())

@count()
def update(t):
    x = linspace(-6*pi, 6*pi, 1000)
    y = sin(x + t * 0.1)
    z = cos(x + t * 0.1)
    source.data = dict(x=x, y=y, z=z)

document = curdoc()
document.add_root(plot)
document.add_periodic_callback(update, 100)

if __name__ == "__main__":
    print("\nanimating... press ctrl-C to stop")
    session = push_session(document)
    session.show()
    session.loop_until_closed()
