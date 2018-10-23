from bokeh.plotting import figure, show, output_file

output_file('multipolygon_with_separate_parts.html')

p = figure(plot_width=400, plot_height=400)
p.multi_polygons(xs=[[[ [1, 1, 2, 2], [1.2, 1.6, 1.6], [1.8, 1.8, 1.6] ], [ [3, 4, 3] ]]],
                 ys=[[[ [4, 3, 3, 4], [3.2, 3.2, 3.6], [3.4, 3.8, 3.8] ], [ [1, 1, 3] ]]])

show(p)
