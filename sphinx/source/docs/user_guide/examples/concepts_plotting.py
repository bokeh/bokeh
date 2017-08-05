from bokeh.plotting import figure, output_file, show

# create a Figure object
p = figure(plot_width=300, plot_height=300, tools="pan,reset,save")

# add a Circle renderer to this figure
p.circle([1, 2.5, 3, 2], [2, 3, 1, 1.5], radius=0.3, alpha=0.5)

# specify how to output the plot(s)
output_file("foo.html")

# display the figure
show(p)
