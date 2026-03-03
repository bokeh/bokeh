"""Koch snowflake rendered with WebGL patch.

Builds the classic Koch snowflake boundary by recursively replacing each
edge segment with the Koch curve motif, then renders as a single filled
polygon to demonstrate complex polygon rendering with WebGL.
"""
import math

from bokeh.plotting import figure, show


def koch_curve(x0, y0, x1, y1, depth):
    """Recursively generate Koch curve points between (x0,y0) and (x1,y1)."""
    if depth == 0:
        return [(x0, y0)]

    dx = x1 - x0
    dy = y1 - y0

    # Divide the segment into thirds
    ax, ay = x0 + dx / 3, y0 + dy / 3
    bx, by = x0 + 2 * dx / 3, y0 + 2 * dy / 3

    # Peak of the equilateral triangle
    px = (ax + bx) / 2 + math.sqrt(3) / 6 * (y0 - y1)
    py = (ay + by) / 2 + math.sqrt(3) / 6 * (x1 - x0)

    points = []
    points.extend(koch_curve(x0, y0, ax, ay, depth - 1))
    points.extend(koch_curve(ax, ay, px, py, depth - 1))
    points.extend(koch_curve(px, py, bx, by, depth - 1))
    points.extend(koch_curve(bx, by, x1, y1, depth - 1))

    return points


depth = 6

# Start with an equilateral triangle
angle = 2 * math.pi / 3
vertices = [(math.cos(math.pi / 2 + i * angle), math.sin(math.pi / 2 + i * angle)) for i in range(3)]

# Build the Koch snowflake boundary
boundary = []
for i in range(3):
    x0, y0 = vertices[i]
    x1, y1 = vertices[(i + 1) % 3]
    boundary.extend(koch_curve(x0, y0, x1, y1, depth))

xs = [pt[0] for pt in boundary]
ys = [pt[1] for pt in boundary]

n_points = len(xs)

p = figure(
    title=f"Koch Snowflake (depth={depth}, {n_points} boundary points, WebGL)",
    width=700, height=700,
    output_backend="webgl",
    match_aspect=True,
    tools="pan,wheel_zoom,reset",
)
p.patch(
    x=xs, y=ys,
    fill_color="steelblue", fill_alpha=0.7,
    line_color="navy", line_width=1,
)

show(p)
