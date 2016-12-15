from bokeh.plotting import figure, output_file, show

output_file("patch.html")

p = figure(plot_width=400, plot_height=400)

# add a patch renderer with a NaN value
nan = float('nan')
p.patch([1, 2, 3, nan, 4, 5, 6], [6, 7, 5, nan, 7, 3, 6], alpha=0.5, line_width=2)

show(p)
