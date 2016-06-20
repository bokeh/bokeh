from itertools import product
from math import pi

from bokeh.plotting import figure, show, output_file

cats = ['None', 'Alpha', 'RGB', 'RGBA', 'Alpha+RGB', 'Alpha+RGBA']

p = figure(x_range=cats, y_range=cats,
           title="Fill and Line Color Combinations")

p.xaxis.axis_label = "Fill Options"
p.xaxis.major_label_orientation = pi/4
p.yaxis.axis_label = "Line Options"
p.grid.grid_line_color = None
p.toolbar_location = None

alpha = 0.5
fill_color = (242, 44, 64)
fill_color_alpha = (242, 44, 64, alpha)
line_color = (0, 0, 0)
line_color_alpha = (0, 0, 0, alpha)

# define fill and line color combinations
fill = [(1, {}),
        (2, {'fill_alpha': alpha}),
        (3, {'fill_color': fill_color}),
        (4, {'fill_color': fill_color_alpha}),
        (5, {'fill_alpha': alpha, 'fill_color': fill_color}),
        (6, {'fill_alpha': alpha, 'fill_color': fill_color_alpha})]

line = [(1, {}),
        (2, {'line_alpha': alpha}),
        (3, {'line_color': line_color}),
        (4, {'line_color': line_color_alpha}),
        (5, {'line_alpha': alpha, 'line_color': line_color}),
        (6, {'line_alpha': alpha, 'line_color': line_color_alpha})]

# plot intersection of fill and line combinations
combinations = product(fill, line)
for comb in combinations:
    x, fill_options = comb[0]
    y, line_options = comb[1]

    options = fill_options.copy()
    options.update(line_options)

    p.circle(x, y, line_width=7, size=50, **options)

output_file('properties_alpha.html', title="properties_alpha.py example")

show(p)
