import numpy as np
from bokeh.plotting import *

N = 100

x = np.linspace(0.1, 5, N)

output_file("logplot.html", title="log axis example")

hold()

figure(tools="pan,wheel_zoom,box_zoom,reset,previewsave",
    y_axis_type="log", y_range=[0.001, 10**22], title="log axis example")

line(x, np.sqrt(x), line_width=2, line_color="yellow", legend="y=sqrt(x)")

line(x, x, legend="y=x")
circle(x, x, legend="y=x")

line(x, x**2, legend="y=x**2")
circle(x, x**2, fill_color=None, line_color="green", legend="y=x**2")

line(x, 10**x, line_color="red", line_width=2, legend="y=10^x")

line(x, x**x, line_color="purple", line_width=2, legend="y=x^x")

line(x, 10**(x**2), line_color="orange", line_width=2, legend="y=10^(x^2)")


show()  # open a browser