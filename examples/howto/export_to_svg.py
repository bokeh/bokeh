from numpy import arange, pi, sin

from bokeh.models import Circle, ColumnDataSource, LinearAxis, Plot
from bokeh.io import export_svg

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)

source = ColumnDataSource(
    data=dict(x=x, y=y)
)

plot = Plot(min_border=80)
circle = Circle(x="x", y="y", fill_color="red", size=5)
x_axis_label = r"x\cdot\pi"
y_axis_label = r"\sin(x)"

plot.add_glyph(source, circle)
plot.add_layout(LinearAxis(axis_label=x_axis_label), 'below')
plot.add_layout(LinearAxis(axis_label=y_axis_label), 'left')

export_svg(plot, filename="plot.svg")