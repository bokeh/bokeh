from bokeh.plotting import figure, output_file, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# set output to static HTML file
output_file("first_steps.html")

# create a new plot with a specific size
p = figure(
    title="Plot resizing example",
    plot_width=350,
    plot_height=250,
    x_axis_label="x",
    y_axis_label="y",
)

# chage plot size
p.plot_width = 450
p.plot_height = 150

# add circle renderer with additional arguments
circle = p.circle(
    x,
    y,
    legend_label="Objects",
    fill_color="red",
    fill_alpha=0.5,
    line_color="blue",
    size=80,
)

# show the results
show(p)
