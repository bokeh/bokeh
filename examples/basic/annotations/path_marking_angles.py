''' Compare arrowhead directions and rotate scatter markers along a curve.

.. bokeh-example-metadata::
    :apis: bokeh.models.ScatterMarking, bokeh.models.GlyphRenderer.add_path_marking
    :refs: :ref:`ug_basic_annotations_path_markings`
    :keywords: arrowheads, markers, paths, angles

'''
from math import pi, sin, tau

from bokeh.layouts import column, row
from bokeh.models import NormalHead, ScatterMarking
from bokeh.plotting import figure, show

x = [i / 24 for i in range(241)]
y = [1.65 * sin(tau * (xi / 10 - 0.12)) for xi in x]
positions = [0.17, 0.34, 0.51, 0.68, 0.85]


def panel(title):
    p = figure(width=335, height=205, title=title, x_range=(-0.6, 10.6),
               y_range=(-2.65, 2.65), tools=None)
    p.title.text_font_size = "14px"
    p.title.text_color = "#1e293b"
    p.title.offset = 8
    p.axis.visible = False
    p.grid.visible = False
    p.outline_line_color = "#dbe3ed"
    p.min_border = 12
    renderer = p.line(x, y, line_width=2.5, line_color="#64748b")
    p.scatter([x[0]], [y[0]], marker="circle", size=6, color="#64748b")
    return p, renderer


panels = []
for title, reference, angle, color in [
    ("Auto · along the path", "auto", 0, "#334155"),
    ("Left · normal to the path", "left", 0, "#0f766e"),
    ("Right · normal to the path", "right", 0, "#b45309"),
    ("Screen · fixed up", "screen", 0, "#2563eb"),
    ("Auto + 30° · relative rotation", "auto", pi / 6, "#7c3aed"),
]:
    p, renderer = panel(title)
    head = NormalHead(size=15, fill_color=color, line_color=color)
    renderer.add_path_marking(head, at=positions, angle_reference=reference, angle=angle)
    panels.append(p)

p, renderer = panel("ScatterMarking · screen + 35°")
renderer.add_path_marking(
    ScatterMarking(marker="square", size=16, fill_color="#be185d",
                line_color="white", line_width=1.3),
    at=positions, angle_reference="screen", angle=35 * pi / 180,
)
panels.append(p)
show(column(row(*panels[:3]), row(*panels[3:])))
