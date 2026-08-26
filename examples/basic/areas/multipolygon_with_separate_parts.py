from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.polygons([{
    "type": "MultiPolygon",
    "coordinates": [
        [
            [[1, 4], [1, 3], [2, 3], [2, 4], [1, 4]],
            [[1.2, 3.2], [1.6, 3.2], [1.6, 3.6], [1.2, 3.2]],
            [[1.8, 3.4], [1.8, 3.8], [1.6, 3.8], [1.8, 3.4]],
        ],
        [[[3, 1], [4, 1], [3, 3], [3, 1]]],
    ],
}])

show(p)
