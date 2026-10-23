from bokeh.plotting import figure, show

p = figure(width=400, height=400)

p.polygons([
    {
        "geometry": {"type": "Polygon", "coordinates": [[[1, 2], [3, 1], [2, 4], [1, 2]]]},
        "color": "firebrick", "alpha": 0.8,
    },
    {
        "geometry": {"type": "Polygon", "coordinates": [[[3, 4], [4, 7], [6, 8], [6, 5], [3, 4]]]},
        "color": "navy", "alpha": 0.3,
    },
], color="color", alpha="alpha", line_width=2)

show(p)
