from numpy import arange, pi, sin

from bokeh.models import ColumnDataSource, LinearAxis, Plot, Scatter, TeX
from bokeh.plotting import show

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)

source = ColumnDataSource(
    data=dict(x=x, y=y),
)

plot = Plot(min_border=80)
circle = Scatter(x="x", y="y", fill_color="red", size=5, line_color="black")

plot.add_glyph(source, circle)
plot.add_layout(LinearAxis(axis_label=TeX(text=r"-2\pi \arr 2\pi", macros={"arr": r"\rightarrow"})), 'below')
plot.add_layout(LinearAxis(axis_label=TeX(text=r"\sin(x)")), 'left')

show(plot)
