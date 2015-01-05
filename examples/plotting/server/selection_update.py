# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.models import BoxSelectTool, HBox, LassoSelectTool, Paragraph, VBox
from bokeh.plotting import curdoc, cursession, figure, output_server, show, VBox

N = 1000

x = np.random.normal(size=N) * 100
y = np.random.normal(size=N) * 100

output_server("selection_update")

TOOLS="box_select,lasso_select"

# create the scatter plot
p = figure(tools=TOOLS, plot_width=600, plot_height=600)
p.scatter(x, y, size=3, color="#3A5785", alpha=0.6, name="scatter")

renderer = p.select(dict(name="scatter"))
scatter_ds = renderer[0].data_source

box_select_tool = p.select(dict(type=BoxSelectTool))
box_select_tool.select_every_mousemove = False
lasso_select_tool = p.select(dict(type=LassoSelectTool))
lasso_select_tool.select_every_mousemove = False

# create the horizontal historgram
hist, hedges = np.histogram(x, bins=20)

ph = figure(toolbar_location=None, plot_width=p.plot_width, plot_height=200, x_range=p.x_range, title=None)
ph.quad(bottom=0, left=hedges[:-1], right=hedges[1:], top=hist, color="#3A5785", alpha=0.6, line_color=None)
ph.quad(bottom=0, left=hedges[:-1], right=hedges[1:], top=hist, color="white", alpha=0.6, line_color="#3A5785", name="hhist")

renderer = ph.select(dict(name="hhist"))
ph_source = renderer[0].data_source

# create the vertical historgram
hist, vedges = np.histogram(y, bins=20)

pv = figure(toolbar_location=None, plot_width=200, plot_height=p.plot_height, y_range=p.y_range, title=None)
pv.quad(left=0, bottom=vedges[:-1], top=vedges[1:], right=hist, color="#3A5785", alpha=0.6, line_color=None)
pv.quad(left=0, bottom=vedges[:-1], top=vedges[1:], right=hist, color="white", alpha=0.6, line_color="#3A5785", name="vhist")

renderer = pv.select(dict(name="vhist"))
pv_source = renderer[0].data_source

# TODO (bev) hopefully replace wit Paragraph()
pfill = figure(toolbar_location=None, plot_width=200, plot_height=200)

# set up callbacks
def on_selection_change(obj, attr, old, new):
    inds = np.array(new)
    if len(inds) == 0:
        hhist, new_hedges = np.histogram(x, bins=hedges)
        vhist, new_vedges = np.histogram(y, bins=vedges)
    else:
        hhist, new_hedges = np.histogram(x[inds], bins=hedges)
        vhist, new_vedges = np.histogram(y[inds], bins=vedges)
    #ph_source.data["left"] = hedges[:-1]
    #ph_source.data["right"] = hedges[1:]
    ph_source.data["top"] = hhist

    #pv_source.data["bottom"] = vedges[:-1]
    #pv_source.data["top"] = vedges[1:]
    pv_source.data["right"] = vhist

    cursession().store_objects(ph_source, pv_source)

scatter_ds.on_change('selected', on_selection_change)

layout = VBox(HBox(p, pv), HBox(ph, pfill))
show(layout) # open a browser

cursession().poll_document(curdoc(), 0.05)
