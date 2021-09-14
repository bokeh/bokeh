from numpy import arange, pi, sin

from bokeh.plotting import figure, show

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)

plot = figure(height=200)
plot.circle(x, y, alpha=0.6, size=7)

plot.yaxis.axis_label = r"\[\sin(x)\]"
plot.xaxis.axis_label = r"\[x\cdot\pi\]"

show(plot)
