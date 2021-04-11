from bokeh.io import curdoc
from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# apply theme to current document
curdoc().theme = "dark_minimal"

# create a plot
p = figure(sizing_mode="stretch_width", max_width=500, height=250)

# add a renderer
p.line(x, y)

# show the results
show(p)
