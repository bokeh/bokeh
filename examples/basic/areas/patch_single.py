from bokeh.plotting import figure, show

p = figure(width=400, height=400)

# Add one polygon with an alpha and line width.
p.polygons([
    {"type": "Polygon", "coordinates": [[[1, 6], [2, 7], [3, 8], [4, 7], [5, 3], [1, 6]]]},
], alpha=0.5, line_width=2)

show(p)
