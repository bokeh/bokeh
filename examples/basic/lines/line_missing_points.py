from math import nan

from bokeh.plotting import figure, show

p = figure(width=400, height=400)

# add a line renderer with NaN values
p.line([1, 2, 3, nan, 4, 5], [6, 7, 2, 4, 4, 5], line_width=8,
       legend_label="line with NaN", alpha=0.5)

# don't use None as a value for a renderer, because it will be drawn as 0
p.line([1, 2, 3, None, 4, 5], [6, 7, 2, 4, 4, 5], line_width=2,
       legend_label="line with None (BAD)", line_dash="dashed", color="red")

show(p)
