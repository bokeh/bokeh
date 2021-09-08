from numpy import arange, pi, sin

from bokeh.plotting import figure, show

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)

plot = figure(height=200)
plot.circle(x, y, fill_color="red", size=5)

plot.xaxis.axis_label = r"$$x\cdot\pi$$"
plot.yaxis.axis_label = r"$$\sin(x)$$"

show(plot)
