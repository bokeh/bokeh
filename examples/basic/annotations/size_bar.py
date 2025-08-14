"""
Example demonstrating the SizeBar annotation for radial glyphs.

SizeBar provides a visual reference for understanding the size mapping
in scatter plots where circle radius varies with data values.
"""

import numpy as np

from bokeh.models import SizeBar
from bokeh.plotting import figure, show

N = 100
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 10
colors = np.array([(r, g, 150) for r, g in zip(50 + 2*x, 30 + 2*y)], dtype=np.uint8)

p = figure()
cr = p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

size_bar = SizeBar(
    renderer=cr,
    title="SizeBar component",
    width="max",
    orientation="horizontal",
    glyph_fill_color="violet", glyph_fill_alpha=0.8, glyph_line_color="black",
    border_line_color="gray", border_line_dash="dotted",
)
p.add_layout(size_bar, "below")

show(p)
