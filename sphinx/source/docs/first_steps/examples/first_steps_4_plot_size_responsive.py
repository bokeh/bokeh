from bokeh.plotting import figure, output_file, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# set output to static HTML file
output_file("first_steps.html")

# create a new plot with responsive width
p = figure(
    title="Plot responsive sizing example",
    sizing_mode="stretch_width",
    plot_height=250,
    x_axis_label="x",
    y_axis_label="y",
)

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
