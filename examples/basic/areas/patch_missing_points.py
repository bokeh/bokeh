from bokeh.plotting import figure, show

p = figure(width=400, height=400)

# Disjoint parts are represented naturally as one MultiPolygon feature.
p.polygons([{
    "type": "MultiPolygon",
    "coordinates": [
        [[[1, 6], [2, 7], [3, 5], [1, 6]]],
        [[[4, 7], [5, 3], [6, 6], [4, 7]]],
    ],
}], alpha=0.5, line_width=2)

show(p)
