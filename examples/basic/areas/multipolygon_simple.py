from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.multi_polygons(xs=[[[[1, 1, 2, 2]]]],
                 ys=[[[[3, 4, 4, 3]]]])

show(p)
