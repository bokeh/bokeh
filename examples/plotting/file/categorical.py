
import numpy as np
from six.moves import zip
from bokeh.plotting import *
from bokeh.objects import Range1d

N = 4000

factors = ["a", "b", "c", "d", "e", "f", "g", "h"]
factors2 = ["a:0.1", "b:0.2", "c:0.3", "d:0.4", "e:0.5", "f:0.6", "g:0.7", "h:0.8"]
x0 = [0,0,0,0,0,0,0,0]
x =  [50, 40, 65, 10, 25, 37, 80, 60]

output_file("categorical.html", title="categorical.py example")

hold()

segment(x0, factors2, x, factors2, y_range=factors, x_range=Range1d(start=0, end=100), 
        line_width=4, line_color="green", tools="resize", title="Dot Plot")
circle(x, factors2, size=12, fill_color="orange", line_color="green", line_width=3, Name="categorical example")

figure()

factors = ["foo", "bar", "baz"]
x = ["foo", "foo", "foo", "bar", "bar", "bar", "baz", "baz", "baz"]
y = ["foo", "bar", "baz", "foo", "bar", "baz", "foo", "bar", "baz"]
colors = ["#0B486B", "#79BD9A", "#CFF09E", "#79BD9A", "#0B486B", "#79BD9A", "#CFF09E", "#79BD9A", "#0B486B"]

rect(x, y, color=colors, x_range=factors, y_range=factors,
    width=1, height=1, tools="resize, hover", title="Categorical Heatmap")

show()  # open a browser
