from bokeh.plotting import figure, show, output_file

output_file('multipolygon_with_holes.html')

p = figure(plot_width=400, plot_height=400)
p.multi_polygons(xs=[[[ [1, 2, 2, 1], [1.2, 1.6, 1.6], [1.8, 1.8, 1.6] ]]],
                 ys=[[[ [3, 3, 4, 4], [3.2, 3.6, 3.2], [3.4, 3.8, 3.8] ]]])

show(p)
