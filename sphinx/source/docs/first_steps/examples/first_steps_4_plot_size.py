from bokeh.plotting import figure, output_file, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# set output to static HTML file
output_file("first_steps.html")

# create a new plot with a specific size
p = figure(
    title="Plot sizing example",
    plot_width=350,
    plot_height=250,
    x_axis_label="x",
    y_axis_label="y",
)

# add circle renderer
circle = p.circle(x, y, fill_color="red", size=15)

# show the results
show(p)
