import numpy as np

from bokeh.models import BoxSelectTool, LassoSelectTool, PolySelectTool
from bokeh.plotting import figure, show

N = 2000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.array([[r, g, 150] for r, g in zip(50 + 2*x, 30 + 2*y)], dtype="uint8")

p = figure()

box_select = BoxSelectTool(persistent=True)
poly_select = PolySelectTool(persistent=True)
lasso_select = LassoSelectTool(persistent=True)

p.add_tools(box_select, poly_select, lasso_select)
p.add_tools("crosshair", "hover", "zoom_in", "zoom_out", "undo", "redo")

p.circle(x, y, radius=radii,
         fill_color=colors, fill_alpha=0.6, line_color=None)

show(p)
