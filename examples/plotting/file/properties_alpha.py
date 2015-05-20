import bokeh.plotting as plt
from itertools import product

plt.output_file('properties_alpha.html')

cats = ['RGB', 'RGBA', 'Alpha+RGB', 'Alpha+RGBA']
p = plt.figure(x_range=cats, y_range=cats,
               title="Fill and Line Color Property Combinations")

alpha = 0.5
fill_color = (242, 44, 64)
fill_color_alpha = (242, 44, 64, alpha)
line_color = (64, 126, 231)
line_color_alpha = (64, 126, 231, alpha)

# define fill and line color combinations
fill = [(1, {'fill_color': fill_color}),
        (2, {'fill_color': fill_color_alpha}),
        (3, {'fill_alpha': alpha, 'fill_color': fill_color}),
        (4, {'fill_alpha': alpha, 'fill_color': fill_color_alpha})]

line = [(1, {'line_color': line_color}),
        (2, {'line_color': line_color_alpha}),
        (3, {'line_alpha': alpha, 'line_color': line_color}),
        (4, {'line_alpha': alpha, 'line_color': line_color_alpha})]

# plot intersection of fill and line combinations
combinations = product(fill, line)
for comb in combinations:
    x, fill_options = comb[0]
    y, line_options = comb[1]

    options = fill_options.copy()
    options.update(line_options)

    p.circle(x, y, line_width=7, size=50, **options)

p.xaxis[0].axis_label = "Fill Options"
p.yaxis[0].axis_label = "Line Options"
plt.show(p)
