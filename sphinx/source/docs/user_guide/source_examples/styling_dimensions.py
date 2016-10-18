from bokeh.plotting import figure, output_file, show

output_file("dimensions.html")

# create a new plot with specific dimensions
p = figure(plot_width=700)
p.plot_height = 300

p.circle([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
