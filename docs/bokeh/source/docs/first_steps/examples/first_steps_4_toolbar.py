from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create a plot
p = figure(
    title="Toolbar positioning example",
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# move toolbar to the bottom
p.toolbar_location = "below"

# add a renderer
p.scatter(x, y, size=10)

# show the results
show(p)
