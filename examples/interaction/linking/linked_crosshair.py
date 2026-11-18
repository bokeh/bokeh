''' Track the cursor position in two plots with shared crosshair spans.

.. bokeh-example-metadata::
    :title: Linked crosshair
    :keywords: linked crosshair, interaction, linking
    :apis: bokeh.models.CrosshairTool, bokeh.models.Span, bokeh.plotting.figure.add_tools, bokeh.plotting.figure.circle
    :gallery:
    :thumbnail-alt: A two plots with vertical and horizontal crosshair tools linked.
'''

from random import random

from bokeh.layouts import row
from bokeh.models import CrosshairTool, Span
from bokeh.plotting import figure, show

x = [random() * 10 for _ in range(200)]
y = [random() * 10 for _ in range(200)]

width = Span(dimension="width", line_dash="dashed", line_width=2)
height = Span(dimension="height", line_dash="dotted", line_width=2)

p1 = figure(height=400, width=400, x_range=(0, 10), y_range=(0, 10),
            tools="hover", toolbar_location=None)
p1.add_tools(CrosshairTool(overlay=[width, height]))
p1.circle(x, y, radius=0.2, alpha=0.3, hover_alpha=1.0)

p2 = figure(height=400, width=250, x_range=(0, 10), y_range=(0, 10),
            tools="hover", toolbar_location=None)
p2.add_tools(CrosshairTool(overlay=[width, height]))
p2.circle(x, y, radius=0.2, alpha=0.3, hover_alpha=1.0)

show(row(p1, p2))
