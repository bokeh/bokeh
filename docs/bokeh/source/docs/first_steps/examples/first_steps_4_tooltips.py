from bokeh.models import HoverTool
from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

p = figure(
    y_range=(0, 10),
    toolbar_location=None,
    tools=[HoverTool()],
    tooltips="Data point @x has the value @y",
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# add renderers
p.scatter(x, y, size=10)
p.line(x, y, line_width=2)

# show the results
show(p)
