from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create a plot
p = figure(
    title="Customized grid lines example",
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# add a renderer
p.line(x, y, line_color="green", line_width=2)

# change things only on the x-grid
p.xgrid.grid_line_color = "red"

# change things only on the y-grid
p.ygrid.grid_line_alpha = 0.8
p.ygrid.grid_line_dash = [6, 4]

# show the results
show(p)
