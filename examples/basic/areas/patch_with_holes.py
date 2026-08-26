from bokeh.plotting import figure, show

p = figure(width=400, height=400, tools="pan,wheel_zoom,reset,hover")

p.polygons({
    "type": "Polygon",
    "coordinates": [
        [[1, 1], [1, 4], [4, 4], [4, 1], [1, 1]],
        [[1.5, 1.5], [2.5, 1.5], [2, 2.5], [1.5, 1.5]],
        [[3, 2], [3, 3], [3.5, 3], [3.5, 2], [3, 2]],
        [[2, 3.2], [2.2, 3.8], [2.5, 3.9], [2.8, 3.6], [2.6, 3.1], [2, 3.2]],
    ],
}, alpha=0.5, line_width=2, color="navy")

show(p)
