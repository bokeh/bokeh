from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.polygons([
    {
        "geometry": {
            "type": "MultiPolygon",
            "coordinates": [
                [
                    [[1, 4], [1, 3], [2, 3], [2, 4], [1, 4]],
                    [[1.2, 3.2], [1.6, 3.2], [1.6, 3.6], [1.2, 3.2]],
                    [[1.8, 3.4], [1.8, 3.8], [1.6, 3.8], [1.8, 3.4]],
                ],
                [[[3, 1], [3, 3], [4, 1], [3, 1]]],
            ],
        },
        "color": "blue",
    },
    {
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
                [[1.3, 1.3], [1.3, 1.7], [1.7, 1.7], [1.7, 1.3], [1.3, 1.3]],
            ],
        },
        "color": "red",
    },
], color="color")

show(p)
