from numpy import pi, arange, sin, linspace

from bokeh.models import LinearAxis, Range1d
from bokeh.plotting import figure, show, output_file

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
y2 = linspace(0, 100, len(x))

p = figure(x_range=(-6.5, 6.5), y_range=(-1.1, 1.1), min_border=80)

p.circle(x, y, fill_color="red", size=5, line_color="black")

p.extra_y_ranges['foo'] = Range1d(0, 100)
p.circle(x, y2, fill_color="blue", size=5, line_color="black", y_range_name="foo")
p.add_layout(LinearAxis(y_range_name="foo"), 'left')

output_file("twin_axis.html", title="twin_axis.py example")

show(p)
