"""Compare Canvas and WebGL even-odd polygons with deep nesting."""

from bokeh.layouts import row
from bokeh.plotting import figure, show

geometry = {
    "type": "MultiPolygon",
    "coordinates": [
        [
            [[0, 0], [12, 0], [12, 12], [0, 12], [0, 0]],
            [[2, 2], [10, 2], [10, 10], [2, 10], [2, 2]],
        ],
        [
            [[4, 4], [8, 4], [8, 8], [4, 8], [4, 4]],
            [[5, 5], [7, 5], [7, 7], [5, 7], [5, 5]],
        ],
        [
            [[15, 0], [27, 0], [27, 12], [15, 12], [15, 0]],
            [[18, 3], [18, 9], [24, 9], [24, 3], [18, 3]],
        ],
    ],
}

def make_plot(backend):
    p = figure(width=520, height=420, output_backend=backend, title=backend,
               x_range=(-1, 28), y_range=(-1, 13), match_aspect=True)
    p.polygons(geometry, fill_color="#2563eb", fill_alpha=0.75,
               hatch_pattern="/", hatch_alpha=0.35, line_color="white", line_width=2)
    return p

show(row(make_plot("canvas"), make_plot("webgl")))
