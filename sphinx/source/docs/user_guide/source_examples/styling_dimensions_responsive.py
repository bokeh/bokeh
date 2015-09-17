from bokeh.plotting import figure, output_file, show

output_file("dimensions_responsive.html")

# create a new plot with a title
p = figure(plot_width=700, plot_height=300, responsive=True)
p.title = "Try resizing your browser window and using the resize tool on the plot"
p.circle([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
