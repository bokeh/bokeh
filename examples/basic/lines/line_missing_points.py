from math import nan

from bokeh.plotting import figure, show

p = figure(width=400, height=400)

# add a line renderer with NaN values
p.line([1, 2, 3, nan, 4, 5], [6, 7, 2, 4, 4, 5], line_width=2)

show(p)
