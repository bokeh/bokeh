from bokeh.models import NumeralTickFormatter
from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create new plot
p = figure(
    title="Tick formatter example",
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# format axes ticks
p.yaxis[0].formatter = NumeralTickFormatter(format="$0.00")

# add renderers
p.scatter(x, y, size=8)
p.line(x, y, color="navy", line_width=1)

# show the results
show(p)
