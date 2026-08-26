from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.polygons([{
    "type": "Polygon",
    "coordinates": [[[1, 3], [1, 4], [2, 4], [2, 3], [1, 3]]],
}])

show(p)
