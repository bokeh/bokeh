
import numpy as np
from bokeh.plotting import *

N = 4000

factors = ["a", "b", "c", "d", "e", "f", "g", "h"]
x0 = [0,0,0,0,0,0,0,0]
x =  [50, 40, 65, 10, 25, 37, 80, 60]

output_file("categorical.html", title="categorical.py example")

hold()

segment(x0, factors, x, factors, y_range=factors, x_range=[0,100],
        line_width=2, line_color="green", tools="resize,previewsave", title="Dot Plot")
circle(x, factors, size=15, fill_color="orange", line_color="green", line_width=3, Name="categorical example")

figure()

factors = ["foo", "bar", "baz"]
x = ["foo", "foo", "foo", "bar", "bar", "bar", "baz", "baz", "baz"]
y = ["foo", "bar", "baz", "foo", "bar", "baz", "foo", "bar", "baz"]
colors = ["#0B486B", "#79BD9A", "#CFF09E", "#79BD9A", "#0B486B", "#79BD9A", "#CFF09E", "#79BD9A", "#0B486B"]

rect(x, y, color=colors, x_range=factors, y_range=factors,
    width=1, height=1, tools="resize, hover,previewsave", title="Categorical Heatmap")

show()  # open a browser
