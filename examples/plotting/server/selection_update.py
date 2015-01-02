# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.models import BoxSelectTool, LassoSelectTool
from bokeh.plotting import curdoc, cursession, figure, output_server, show, VBox

N = 1000

x = np.random.normal(size=N) * 100
y = np.random.normal(size=N) * 100

output_server("selection_update")

TOOLS="box_select,lasso_select"

# create the scatter plot
ps = figure(tools=TOOLS)
ps.scatter(x, y, size=3, color="#3A5785", alpha=0.6, name="scatter")

renderer = ps.select(dict(name="scatter"))
scatter_ds = renderer[0].data_source

box_select_tool = ps.select(dict(type=BoxSelectTool))
box_select_tool.select_every_mousemove = False
lasso_select_tool = ps.select(dict(type=LassoSelectTool))
lasso_select_tool.select_every_mousemove = False

# create the historgram
hist, edges = np.histogram(x, bins=20)

ph = figure(toolbar_location=None, plot_height=200, x_range=ps.x_range)
ph.quad(bottom=0, left=edges[:-1], right=edges[1:], top=hist, color="#3A5785", alpha=0.6, line_color=None, name="hist")

renderer = ph.select(dict(name="hist"))
hist_ds = renderer[0].data_source

# set up callbacks
def on_selection_change(obj, attr, old, new):
    inds = np.array(new)
    if len(inds) == 0:
        hist, edges = np.histogram(x, bins=20)
    else:
        hist, edges = np.histogram(x[inds], bins=20)
    hist_ds.data["left"] = edges[:-1]
    hist_ds.data["right"] = edges[1:]
    hist_ds.data["top"] = hist
    cursession().store_objects(hist_ds)

scatter_ds.on_change('selected', on_selection_change)

show(VBox(ps, ph)) # open a browser

cursession().poll_document(curdoc(), 0.05)
