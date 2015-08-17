from bokeh.plotting import figure, output_file, show

output_file("patch.html")

p = figure(plot_width=400, plot_height=400)

p.patches([[1, 3, 2], [3, 4, 6, 6]], [[2, 1, 4], [4, 7, 8, 5]],
          color=["firebrick", "navy"], alpha=[0.8, 0.3], line_width=2)

show(p)
