from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create a plot
p = figure(
    title="Background colors example",
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# add a renderer
p.line(x, y, line_color="green", line_width=2)

# change the fill colors
p.background_fill_color = (204, 255, 255)
p.border_fill_color = (102, 204, 255)
p.outline_line_color = (0, 0, 255)

# show the results
show(p)
