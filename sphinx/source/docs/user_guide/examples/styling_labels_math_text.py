from numpy import arange, pi, sin
from bokeh.plotting import figure, show
from bokeh.models import ColumnDataSource, MathText

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
source = ColumnDataSource(
    data=dict(x=x, y=y)
)

x_axis_label = MathText(r"x\cdot\pi")
y_axis_label = MathText(r"\sin(x)")

p = figure(x_axis_label=x_axis_label, y_axis_label=y_axis_label)
p.circle(x=x, y=y, fill_color="red", size=5)

show(p)
