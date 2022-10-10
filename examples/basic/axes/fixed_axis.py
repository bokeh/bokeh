import numpy as np

from bokeh.plotting import figure, show

x = np.linspace(-6, 6, 500)
y = 8*np.sin(x)*np.sinc(x)

p = figure(width=800, height=300, title="", tools="",
           toolbar_location=None, match_aspect=True)

p.line(x, y, color="navy", alpha=0.4, line_width=4)
p.background_fill_color = "#efefef"
p.xaxis.fixed_location = 0
p.yaxis.fixed_location = 0

show(p)
