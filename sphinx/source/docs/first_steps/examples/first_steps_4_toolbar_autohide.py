from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create a plot
p = figure(
    title="Toolbar autohide example",
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# activate toolbar autohide
p.toolbar.autohide = True

# add a renderer
p.line(x, y)

# show the results
show(p)
