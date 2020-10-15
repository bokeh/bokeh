from bokeh.plotting import figure, output_file, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# set output to static HTML file
output_file("first_steps.html")

# create a new plot with responsive width
p = figure(
    y_range=(0, 25),
    title="Axis range example",
    sizing_mode="stretch_width",
    max_width=600,
    plot_height=250,
)

# add circle renderer with additional arguments
circle = p.circle(x, y, size=8)

# show the results
show(p)
