import numpy as np

from bokeh.plotting import figure, show
from bokeh.util.hex import axial_to_cartesian

q = np.array([0,  0, 0, -1, -1,  1, 1])
r = np.array([0, -1, 1,  0,  1, -1, 0])

p = figure(width=400, height=400, toolbar_location=None)
p.grid.visible = False

p.hex_tile(q, r, size=1, fill_color=["firebrick"]*3 + ["navy"]*4,
           line_color="white", alpha=0.5)

x, y = axial_to_cartesian(q, r, 1, "pointytop")

p.text(x, y, text=[f"({q}, {r})" for (q, r) in zip(q, r)],
       text_baseline="middle", text_align="center")

show(p)
