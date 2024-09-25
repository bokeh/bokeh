''' This Python script leverages Bokeh to create a visual representation of rose curves arranged in a polar grid. The script imports key libraries like fractions.Fraction to handle rational numbers, 
numpy for mathematical calculations, and Bokeh for rendering the plots. The main function, rose, takes a subplot object (xy), a rational fraction (k), and an optional amplitude (A) to generate the curves. 
The rose curves are calculated by determining the angle and radius for each point based on the fraction's numerator and denominator. The script determines the number of petals for each curve depending on 
whether the numerator and denominator produce even or odd multiples.

Each rose curve is drawn on a polar subplot, and the script assigns a unique dark color to each curve, chosen from a set of predefined colors. If a fraction has already been used, the corresponding color is 
retrieved from the color_map; otherwise, a new color is selected. The layout consists of a 9x9 grid of plots, where each subplot represents a different rational fraction (n/d). Each subplot's axes are mapped
to a specific portion of the grid, allowing for a clean, organized display of the rose curves. The plot is then displayed using Bokeh’s show function, creating a grid of intricate rose patterns with unique 
colors and geometries based on the fractional values.

.. bokeh-example-metadata:
    :sampledata: rose
    :apis: bokeh.plotting.Figure.scatter, bokeh.transform.linear_cmap, bokeh.transform.factor_mark
    :refs: :ref:`userguide_plotting` > :ref:`userguide_plotting_scatter_markers`
    :keywords: rose, polar, polartransform, transform

.. _Palmer penguin dataset: https://github.com/allisonhorst/palmerpenguins
'''

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
