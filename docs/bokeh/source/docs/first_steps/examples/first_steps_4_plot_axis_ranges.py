from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create a new plot with responsive width
p = figure(
    y_range=(0, 25),
    title="Axis range example",
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# add scatter renderer with additional arguments
p.scatter(x, y, size=8)

# show the results
show(p)
