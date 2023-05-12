from bokeh.io import show
from bokeh.plotting import figure

plot = figure()

plot.hstrip(
    y0=[45, 60, 80],
    y1=[50, 70, 95],
    line_color="pink",
    fill_color="purple",
    hatch_pattern="x", hatch_color="yellow",
)
plot.vstrip(
    x0=[45, 60, 80],
    x1=[50, 70, 95],
    line_color="pink",
    fill_color="yellow",
    hatch_pattern="/", hatch_color="purple",
)

show(plot)
