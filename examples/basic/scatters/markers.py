''' A scatter plot showing every marker type.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.scatter, bokeh.plotting.figure.text
    :refs: :ref:`ug_basic_scatters_markers`
    :keywords: scatter, markers

'''
from numpy.random import random

from bokeh.core.enums import MarkerType
from bokeh.plotting import figure, show

p = figure(title="Bokeh Markers", toolbar_location=None)
p.grid.grid_line_color = None
p.background_fill_color = "#eeeeee"
p.axis.visible = False
p.y_range.flipped = True

N = 10

for i, marker in enumerate(MarkerType):
    x = i % 4
    y = (i // 4) * 4 + 1

    p.scatter(random(N)+2*x, random(N)+y, marker=marker, size=14,
              line_color="navy", fill_color="orange", alpha=0.5)

    p.text(2*x+0.5, y+2.5, text=[marker],
           text_color="firebrick", text_align="center", text_font_size="13px")

show(p)
