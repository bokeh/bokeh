import numpy as np
from bokeh.plotting import figure, show, output_file, vplot

output_file("patches_with_holes.html", title="patches_with_holes.py example")

p1 = figure(title="patches with holes 1")
p1.patches(
    xs=[[[1, 1.1, 2, 1.9], [1.8, 1.7, 1.2, 1.2]], [3, 3.1, 4, 3.9]],
    ys=[[[1, 2.0, 2, 1.0], [1.1, 1.9, 1.9, 1.2]], [3, 4, 4, 3]],
    fill_color=[None, 'pink'], line_color='blue'
)

p2 = figure(title="patches with holes 2", tools='tap')
p2.patches(
    xs=[[[1, 1.1, 2, 1.9], [1.8, 1.7, 1.2, 1.2]], [3, 3.1, 4, 3.9], [5, 6, 5.5, np.NaN, 5, 6, 5.5], [[1, 1.1, 2, 1.9], [1.8, 1.7, 1.2, 1.2], np.NaN, [3, 3.1, 4, 3.9]]],
    ys=[[[1, 2.0, 2, 1.0], [1.1, 1.9, 1.9, 1.2]], [3, 4.0, 4, 3.0], [3, 4, 4.0, np.NaN, 1, 2, 2.0], [[3, 4.0, 4, 3.0], [3.1, 3.9, 3.9, 3.2], np.NaN, [1, 2.0, 2, 1.0]]],
    fill_color=['pink', 'orange', 'blue', 'red'], line_color=None
)

show(vplot(p1, p2))
