from fractions import Fraction
from math import pi

import numpy as np

from bokeh.colors.named import colors
from bokeh.io import show
from bokeh.models import ColumnDataSource, Plot
from bokeh.models.expressions import PolarTransform
from bokeh.plotting import figure, gridplot

dark_colors = iter(color for color in colors if color.brightness < 0.6)
color_map = {}

def rose(k: Fraction, A: float = 1) -> Plot:
    n = k.numerator
    d = k.denominator

    T = d*(2 if n*d % 2 == 0 else 1)

    angle = np.linspace(0, T*pi, T*100)
    radius = A*np.cos(float(k)*angle)

    source = ColumnDataSource(dict(radius=radius, angle=angle))
    t = PolarTransform()

    plot = figure(
        width=100, height=100,
        min_border=0,
        x_axis_type=None, y_axis_type=None,
        outline_line_color=None,
    )

    if k in color_map:
        color = color_map[k]
    else:
        color = color_map[k] = next(dark_colors)

    plot.line(x=t.x, y=t.y, line_color=color, source=source)

    return plot

def grid(N: int, D: int):
    for d in range(1, D + 1):
        for n in range(1, N + 1):
            yield rose(Fraction(n, d))

plot = gridplot(list(grid(9, 9)), ncols=9)
show(plot)
