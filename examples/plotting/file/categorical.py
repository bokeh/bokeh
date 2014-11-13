
import numpy as np
from bokeh.plotting import *

N = 4000

factors = ["a", "b", "c", "d", "e", "f", "g", "h"]
x0 = [0,0,0,0,0,0,0,0]
x =  [50, 40, 65, 10, 25, 37, 80, 60]

output_file("categorical.html", title="categorical.py example")

figure(
    title="Dot Plot", tools="resize,previewsave",
    y_range=factors, x_range=[0,100])

hold()

segment(x0, factors, x, factors, line_width=2, line_color="green", )
circle(x, factors, size=15, fill_color="orange", line_color="green", line_width=3, )


factors = ["foo", "bar", "baz"]
x = ["foo", "foo", "foo", "bar", "bar", "bar", "baz", "baz", "baz"]
y = ["foo", "bar", "baz", "foo", "bar", "baz", "foo", "bar", "baz"]
colors = ["#0B486B", "#79BD9A", "#CFF09E", "#79BD9A", "#0B486B", "#79BD9A", "#CFF09E", "#79BD9A", "#0B486B"]

figure(
    title="Categorical Heatmap", tools="resize, hover,previewsave",
    x_range=factors, y_range=factors)

rect(x, y, color=colors, width=1, height=1)

show()  # open a browser
