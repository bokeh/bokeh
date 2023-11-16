from bokeh.io import export_png
from bokeh.plotting import figure

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create a new plot with fixed dimensions
p = figure(width=350, height=250)

# add a scatter renderer
p.scatter(x, y, fill_color="red", size=15)

# save the results to a file
export_png(p, filename="plot.png")
