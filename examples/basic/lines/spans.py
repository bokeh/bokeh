from bokeh.io import show
from bokeh.plotting import figure

plot = figure()

plot.hspan(
    y=[0, 5, 15, 33],
    line_width=[1, 2, 3, 4], line_color="red",
)
plot.vspan(
    x=[0, 5, 15, 33],
    line_width=[1, 2, 3, 4], line_color="blue",
)

show(plot)
