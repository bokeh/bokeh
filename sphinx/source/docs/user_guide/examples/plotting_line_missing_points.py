from bokeh.plotting import figure, output_file, show

output_file("line.html")

p = figure(plot_width=400, plot_height=400)

# add a line renderer with a NaN
nan = float('nan')
p.line([1, 2, 3, nan, 4, 5], [6, 7, 2, 4, 4, 5], line_width=2)

show(p)
