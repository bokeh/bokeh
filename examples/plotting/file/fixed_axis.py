import numpy as np

from bokeh.plotting import figure, show, output_file

x = np.linspace(-6, 6, 500)
y = 8*np.sin(x)*np.sinc(x)

p = figure(plot_width=800, plot_height=300, title="", tools="",
           toolbar_location=None, match_aspect=True)

p.line(x, y, color="navy", alpha=0.4, line_width=4)
p.background_fill_color = "#efefef"
p.xaxis.fixed_location = 0
p.yaxis.fixed_location = 0

output_file("fixed_axis.html", title="fixed_axis.py example")

show(p)
