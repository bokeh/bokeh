from bokeh.io import output_file, show
from bokeh.layouts import gridplot
from bokeh.palettes import Viridis3
from bokeh.plotting import figure

output_file("layout_grid.html")

x = list(range(11))
y0 = x
y1 = [10 - i for i in x]
y2 = [abs(i - 5) for i in x]

# create three plots
p1 = figure(plot_width=250, plot_height=250, title=None)
p1.circle(x, y0, size=10, color=Viridis3[0])
p2 = figure(plot_width=250, plot_height=250, title=None)
p2.triangle(x, y1, size=10, color=Viridis3[1])
p3 = figure(plot_width=250, plot_height=250, title=None)
p3.square(x, y2, size=10, color=Viridis3[2])

# make a grid
grid = gridplot([[p1, p2], [None, p3]])

# show the results
show(grid)
