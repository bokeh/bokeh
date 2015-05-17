from bokeh.plotting import figure, HBox, output_file, show, VBox
from bokeh.models import Range1d

# create some data using python lists
x1 = [0, 1, 2, 3, 4, 5,  6,  7, 8,   9, 10]
y1 = [0, 8, 2, 4, 6, 9, 15, 18, 19, 25, 28]

# EXERCISE: create two more data sets, x2, y2 and x3, y3, however
# you want. Make sure the corresponding x and y data are the same length
from math import sin
x2 = [i/20.0 for i in range(200)]
y2 = [sin(x) for x in x2]

x3 = list(range(11))
y3 = [x**2 for x in x3]

# specify and output static HTML file
output_file("scatter.html")

# EXERCISE: Plot all the sets of points on different plots p1, p2, p3.
# Try setting `color` (or `line_color`) and `alpha` (or `line_alpha`).
# You can also set `line_dash` and `line_width`. One example is given.
p1 = figure(plot_width=300, plot_height=300)
p1.line(x1, y1, size=12, color="red", alpha=0.5)

p2 = figure(plot_width=300, plot_height=300)
p2.line(x2, y2, size=12, color="blue", line_dash=[2, 4])

p3 = figure(plot_width=300, plot_height=300)
p3.line(x3, y3, size=12, line_color="orange", line_width=3)

# create a figure
p4 = figure()

# EXERCISE: add all the same renderers above, on this one plot
p4.line(x1, y1, size=12, color="red", alpha=0.5)
p4.line(x2, y2, size=12, color="blue", line_dash=[2, 4])
p4.line(x3, y3, size=12, line_color="orange", line_width=2)

# show the plots arrayed in a VBox
show(VBox(HBox(p1, p2, p3), p4))