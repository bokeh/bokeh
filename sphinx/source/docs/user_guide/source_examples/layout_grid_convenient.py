from bokeh.io import output_file, show
from bokeh.layouts import gridplot
from bokeh.palettes import Viridis3
from bokeh.plotting import figure

output_file("layout_grid_convenient.html")

x = list(range(11))
y0 = x
y1 = [10 - i for i in x]
y2 = [abs(i - 5) for i in x]

# create three plots
s1 = figure()
s1.circle(x, y0, size=10, color=Viridis3[0])
s2 = figure()
s2.triangle(x, y1, size=10, color=Viridis3[1])
s3 = figure()
s3.square(x, y2, size=10, color=Viridis3[2])

# make a grid
grid = gridplot([s1, s2, s3], ncols=2, plot_width=250, plot_height=250)

# show the results
show(grid)
