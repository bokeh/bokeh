from numpy import arange, pi, sin

from bokeh.models.annotations.labels import Label
from bokeh.plotting import figure, show

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)

p = figure(height=250, title=r"\[\sin(x)\text{ for }x\text{ between }-2\pi\text{ and }2\pi\]")
p.circle(x, y, alpha=0.6, size=7)

label = Label(
    text=r"$$y = \sin(x)$$",
    x=150, y=130,
    x_units="screen", y_units="screen",
)
p.add_layout(label)

p.yaxis.axis_label = r"\[\sin(x)\]"
p.xaxis.axis_label = r"\[x\pi\]"

show(p)
