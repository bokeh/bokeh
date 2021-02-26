from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create a new plot with a title and axis labels
p = figure(title="Glyphs properties example", x_axis_label="x", y_axis_label="y")

# add circle renderer with additional arguments
p.circle(
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
