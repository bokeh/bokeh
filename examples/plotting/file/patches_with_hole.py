import numpy as np
from bokeh.plotting import figure, show, output_file
from bokeh.palettes import Spectral4
from bokeh.models import HoverTool

output_file("patches_with_hole.html", title="patches_with_holes.py example")

hover = HoverTool(tooltips=None)
p = figure(title="Hover over to see different groups", tools=[hover])
p.patches(
    xs=[[[1, 1.1, 2, 1.9], [1.8, 1.7, 1.2, 1.2]], [3, 3.1, 4, 3.9], [5, 6, 5.5, np.NaN, 5, 6, 5.5], [[1, 1.1, 2, 1.9], [1.8, 1.7, 1.2, 1.2], np.NaN, [3, 3.1, 4, 3.9]]],
    ys=[[[1, 2.0, 2, 1.0], [1.1, 1.9, 1.9, 1.2]], [3, 4.0, 4, 3.0], [3, 4, 4.0, np.NaN, 1, 2, 2.0], [[3, 4.0, 4, 3.0], [3.1, 3.9, 3.9, 3.2], np.NaN, [1, 2.0, 2, 1.0]]],
    fill_color=Spectral4, line_color=None, fill_alpha=0.6,
    hover_fill_color='grey', hover_line_color=None,
)

show(p)
