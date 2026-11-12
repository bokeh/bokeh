''' Scatter-style markers at named and fractional positions on a path.

.. bokeh-example-metadata::
    :apis: bokeh.models.ScatterMarking, bokeh.models.GlyphRenderer.add_path_marking
    :refs: :ref:`ug_basic_annotations_path_markings`
    :keywords: markers, paths, path_markings

'''
from math import sin, tau

from bokeh.layouts import row
from bokeh.models import ScatterMarking
from bokeh.plotting import figure, show

marker = ScatterMarking(marker="circle", size=16, fill_color="#ffc46b",
                       fill_alpha=0.65, line_color="#9c4100")
t = [i/120 for i in range(121)]
x = [0.5 + 5.9*u for u in t]
y = [2 + 0.9*sin(tau*u) for u in t]

plots = []
for at, title in (
    ("end", '"end" · one marker at the endpoint'),
    ([0.25, 0.5, 0.75, 1.0], "Fractions · four markers, including the endpoint"),
):
    p = figure(width=380, height=190, x_range=(0, 7), y_range=(0, 4),
               title=title, toolbar_location=None, tools="")
    p.axis.visible = False
    p.grid.visible = False
    path = p.line(x, y, line_color="#0072b2", line_width=3)
    path.add_path_marking(marker, at=at)
    plots.append(p)

show(row(*plots))
