from math import nan

from bokeh.plotting import figure, show

p = figure(width=400, height=400)

# add a patch renderer with NaN values
p.patch([1, 2, 3, nan, 4, 5, 6], [6, 7, 5, nan, 7, 3, 6], alpha=0.5, line_width=2)

show(p)
