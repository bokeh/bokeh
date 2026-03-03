"""Sierpinski triangle rendered with WebGL patches.

Recursively subdivides a triangle into smaller triangles, demonstrating
WebGL-accelerated rendering of many filled polygons.
"""
import numpy as np

from bokeh.palettes import Viridis256
from bokeh.plotting import figure, show


def sierpinski(ax, ay, bx, by, cx, cy, depth, max_depth, xs, ys, colors):
    """Recursively generate Sierpinski triangle patches."""
    if depth >= max_depth:
        xs.append([ax, bx, cx])
        ys.append([ay, by, cy])
        # Color by depth and position
        idx = int(((ax + bx + cx) / 3 + 1) / 2 * 200 + depth * 10) % 256
        colors.append(Viridis256[idx])
        return

    # Midpoints
    abx, aby = (ax + bx) / 2, (ay + by) / 2
    bcx, bcy = (bx + cx) / 2, (by + cy) / 2
    acx, acy = (ax + cx) / 2, (ay + cy) / 2

    # Three sub-triangles (skip the middle one to create the hole)
    sierpinski(ax, ay, abx, aby, acx, acy, depth + 1, max_depth, xs, ys, colors)
    sierpinski(abx, aby, bx, by, bcx, bcy, depth + 1, max_depth, xs, ys, colors)
    sierpinski(acx, acy, bcx, bcy, cx, cy, depth + 1, max_depth, xs, ys, colors)


xs, ys, colors = [], [], []
sierpinski(-1, 0, 1, 0, 0, np.sqrt(3), 0, 9, xs, ys, colors)

p = figure(
    title=f"Sierpinski Triangle ({len(xs)} patches, WebGL)",
    width=800, height=700,
    output_backend="webgl",
    match_aspect=True,
    tools="pan,wheel_zoom,reset",
)
p.patches(xs=xs, ys=ys, fill_color=colors, line_color=None, fill_alpha=0.9)

show(p)
