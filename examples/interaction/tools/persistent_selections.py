import numpy as np

from bokeh.models import BoxSelectTool, LassoSelectTool, PolySelectTool
from bokeh.plotting import figure, show

N = 2000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.array([ [r, g, 150] for r, g in zip(50 + 2*x, 30 + 2*y) ], dtype="uint8")

TOOLS="hover,crosshair,pan,wheel_zoom,zoom_in,zoom_out,box_zoom,undo,redo,reset,save,box_select,poly_select,lasso_select,help"

p = figure(tools=TOOLS)

p.scatter(x, y, radius=radii,
          fill_color=colors, fill_alpha=0.6,
          line_color=None)

box_select = p.select_one(BoxSelectTool)
box_select.persistent = True

poly_select = p.select_one(PolySelectTool)
poly_select.persistent = True

lasso_select = p.select_one(LassoSelectTool)
lasso_select.persistent = True

show(p)
