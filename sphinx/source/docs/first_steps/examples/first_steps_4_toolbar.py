from bokeh.plotting import figure, output_file, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# set output to static HTML file
output_file("first_steps.html")

# create a plot
p = figure(
    title="Toolbar positioning example",
    sizing_mode="stretch_width",
    max_width=500,
    plot_height=250,
)

# move toolbar to the bottom
p.toolbar_location = "below"

# add a renderer
p.circle(x, y, size=10)

# show the results
show(p)
