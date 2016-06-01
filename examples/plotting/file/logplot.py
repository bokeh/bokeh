import numpy as np

from bokeh.plotting import figure, show, output_file

x = np.linspace(0.1, 5, 100)

p = figure(title="log axis example", y_axis_type="log",
           y_range=(0.001, 10**22))

p.line(x, np.sqrt(x), legend="y=sqrt(x)",
       line_color="tomato", line_dash="dotdash")

p.line(x, x, legend="y=x")
p.circle(x, x, legend="y=x")

p.line(x, x**2, legend="y=x**2")
p.circle(x, x**2, legend="y=x**2",
         fill_color=None, line_color="olivedrab")

p.line(x, 10**x, legend="y=10^x",
       line_color="gold", line_width=2)

p.line(x, x**x, legend="y=x^x",
       line_dash="dotted", line_color="indigo", line_width=2)

p.line(x, 10**(x**2), legend="y=10^(x^2)",
       line_color="coral", line_dash="dashed", line_width=2)

p.legend.location = "top_left"

output_file("logplot.html", title="log plot example")

show(p)  # open a browser
