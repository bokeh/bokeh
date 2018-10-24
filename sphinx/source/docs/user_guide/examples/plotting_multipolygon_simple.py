from bokeh.plotting import figure, show, output_file

output_file('multipolygon_simple.html')

p = figure(plot_width=400, plot_height=400)
p.multi_polygons(xs=[[[[1, 1, 2, 2]]]],
                 ys=[[[[3, 4, 4, 3]]]])

show(p)
