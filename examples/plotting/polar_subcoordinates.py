from fractions import Fraction
from math import pi

import numpy as np

from bokeh.colors.named import colors
from bokeh.io import show
from bokeh.models import ColumnDataSource, PolarTransform, Range1d
from bokeh.plotting import figure

dark_colors = iter(color for color in colors if color.brightness < 0.6)
color_map = {}

def rose(xy, k: Fraction, A: float = 1) -> None:
    n = k.numerator
    d = k.denominator

    T = d*(2 if n*d % 2 == 0 else 1)

    angle = np.linspace(0, T*pi, T*100)
    radius = A*np.cos(float(k)*angle)

    source = ColumnDataSource(dict(radius=radius, angle=angle))
    t = PolarTransform()

    if k in color_map:
        color = color_map[k]
    else:
        color = color_map[k] = next(dark_colors)

    xy.line(x=t.x, y=t.y, line_color=color, source=source)

N = D = 9
h = 0.5
plot = figure(width=N*100, height=D*100, x_range=(1-h, N+h), y_range=(D+h, 1-h))

for d in range(1, D + 1):
    for n in range(1, N + 1):
        xy = plot.subplot(
            x_source=Range1d(start=-1, end=1),
            y_source=Range1d(start=-1, end=1),
            x_target=Range1d(start=n-h, end=n+h),
            y_target=Range1d(start=d-h, end=d+h),
        )
        rose(xy, Fraction(n, d))

show(plot)
