from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create a plot
p = figure(
    title="Bands and bonds example",
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# add a renderer
p.line(x, y, line_color="green", line_width=2)

# add bands to the y-grid
p.ygrid.band_fill_color = "olive"
p.ygrid.band_fill_alpha = 0.1

# define vertical bonds
p.xgrid.bounds = (2, 4)

# show the results
show(p)
