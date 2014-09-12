from __future__ import print_function

from numpy import pi, arange, sin, linspace

from bokeh.plotting import *
from bokeh.objects import LinearAxis, Range1d

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
y2 = linspace(0, 100, len(y))

output_file("twin_axis.html")

figure(x_range=[-6.5, 6.5], y_range=[-1.1, 1.1], min_border=80)

hold()

circle(x, y, fill_color="red", size=5, line_color="black")

curplot().extra_y_ranges = {"foo": Range1d(start=0, end=100)}
circle(x, y2, fill_color="blue", size=5, line_color="black", y_range_name="foo")
curplot().add_layout(LinearAxis(y_range_name="foo"), 'left')

show()