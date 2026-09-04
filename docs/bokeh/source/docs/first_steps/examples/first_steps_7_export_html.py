from bokeh.plotting import figure, save

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create a new plot with a specific size
p = figure(sizing_mode="stretch_width", max_width=500, height=250)

# add a scatter renderer
p.scatter(x, y, fill_color="red", size=15)

# save the results to a file
save(p, filename="custom_filename.html", title="Static HTML file")
