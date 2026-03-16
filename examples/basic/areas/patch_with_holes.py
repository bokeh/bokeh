from math import nan

from bokeh.plotting import figure, show

p = figure(width=400, height=400, tools="pan,wheel_zoom,reset,hover")

# add a patch renderer with multiple holes using NaN separators
# outer boundary (square), NaN, first hole (triangle), NaN, second hole (small square), NaN, third hole (pentagon)
p.patch([1, 1, 4, 4, nan, 1.5, 2.5, 2, nan, 3, 3, 3.5, 3.5, nan, 2, 2.2, 2.5, 2.8, 2.6],
        [1, 4, 4, 1, nan, 1.5, 1.5, 2.5, nan, 2, 3, 3, 2, nan, 3.2, 3.8, 3.9, 3.6, 3.1],
        alpha=0.5, line_width=2, color="navy")

show(p)
