"""Compare Canvas and WebGL even-odd polygons with deep nesting."""

from bokeh.layouts import row
from bokeh.plotting import figure, show

nan = float("nan")

# Deliberately ordered as hole, island, outer, island-hole. The second shape is
# disjoint and also owns a hole. Orientation is mixed as well.
xs = [
    2, 10, 10, 2, nan,
    4, 8, 8, 4, nan,
    0, 12, 12, 0, nan,
    5, 7, 7, 5, nan,
    15, 27, 27, 15, nan,
    18, 18, 24, 24,
]
ys = [
    2, 2, 10, 10, nan,
    4, 4, 8, 8, nan,
    0, 0, 12, 12, nan,
    5, 5, 7, 7, nan,
    0, 0, 12, 12, nan,
    3, 9, 9, 3,
]

def make_plot(backend):
    p = figure(width=520, height=420, output_backend=backend, title=backend,
               x_range=(-1, 28), y_range=(-1, 13), match_aspect=True)
    p.patch(xs, ys, fill_color="#2563eb", fill_alpha=0.75,
            hatch_pattern="/", hatch_alpha=0.35, line_color="white", line_width=2)
    return p

show(row(make_plot("canvas"), make_plot("webgl")))
