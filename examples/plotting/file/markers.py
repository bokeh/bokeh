from numpy.random import random

from bokeh.core.enums import MarkerType
from bokeh.plotting import figure, output_file, show

p = figure(title="Bokeh Markers", toolbar_location=None, output_backend="webgl")
p.grid.grid_line_color = None
p.background_fill_color = "#eeeeee"
p.axis.visible = False
p.y_range.flipped = True

N = 10

y = 1

for i, marker in enumerate(MarkerType):
    x = i % 4
    if x == 0:
        y += 4

    p.scatter(random(N)+2*x, random(N)+y, marker=marker, size=14,
              line_color="navy", fill_color="orange", alpha=0.5)

    p.text(2*x+0.5, y+2.5, text=[marker],
           text_color="firebrick", text_align="center", text_font_size="13px")

output_file("markers.html", title="markers.py example")

show(p)  # open a browser
