import numpy as np
from bokeh.plotting import *

N = 100

x = np.linspace(0.1, 10, N)

output_file("logplot.html", title="log axis example")

hold()

figure(tools="pan,wheel_zoom,box_zoom,reset,previewsave", y_axis_type="log")

scatter(x, x, legend="y=x", name="legend_example")
line(x, x, legend="y=x")

line(x, np.exp(x), line_dash=[4, 4], line_color="orange", line_width=2, legend="y=exp(x)")

square(x, x ** 2, fill_color=None, line_color="green", legend="y=x**2")

show()  # open a browser