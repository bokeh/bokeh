from bokeh.plotting import figure, show

p = figure(width=400, height=400)

# Add one polygon with an alpha and line width.
p.polygons(
    x=[1, 2, 3, 4, 5, 1],
    y=[6, 7, 8, 7, 3, 6],
    alpha=0.5,
    line_width=2,
)

show(p)
