from bokeh import layouts
from bokeh.plotting import figure, show

p1 = figure(title="figure_1")
p1.line([1, 2, 3], [1, 2, 3])
p2 = figure(title="figure_2")
p2.line([1, 2, 3], [1, 2, 3])
grid = layouts.gridplot([[p1, p2]])

show(grid)

