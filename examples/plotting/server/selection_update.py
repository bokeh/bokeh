# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.models import BoxSelectTool, HBox, LassoSelectTool, Paragraph, VBox
from bokeh.plotting import curdoc, cursession, figure, output_server, show

N = 1000

x = np.random.normal(size=N) * 100
y = np.random.normal(size=N) * 100

output_server("selection_update")

TOOLS="pan,wheel_zoom,box_select,lasso_select"

# create the scatter plot
p = figure(tools=TOOLS, plot_width=600, plot_height=600, title=None, min_border=10, min_border_left=50)
p.scatter(x, y, size=3, color="#3A5785", alpha=0.6, name="scatter")

renderer = p.select(dict(name="scatter"))
scatter_ds = renderer[0].data_source

box_select_tool = p.select(dict(type=BoxSelectTool))
box_select_tool.select_every_mousemove = False
lasso_select_tool = p.select(dict(type=LassoSelectTool))
lasso_select_tool.select_every_mousemove = False

# create the horizontal historgram
hhist, hedges = np.histogram(x, bins=20)
hzeros = [0]*(len(hedges)-1)

ph = figure(toolbar_location=None, plot_width=p.plot_width, plot_height=200, x_range=p.x_range, title=None, min_border=10, min_border_left=50)
ph.quad(bottom=0, left=hedges[:-1], right=hedges[1:], top=hhist, color="white", line_color="#3A5785")
ph.quad(bottom=0, left=hedges[:-1], right=hedges[1:], top=hzeros, color="#3A5785", alpha=0.6, line_color=None, name="hhist")
ph.xgrid.grid_line_color = None

renderer = ph.select(dict(name="hhist"))
ph_source = renderer[0].data_source

# create the vertical historgram
vhist, vedges = np.histogram(y, bins=20)
vzeros = [0]*(len(vedges)-1)

# need to adjust for toolbar height, unfortunately
th = 42

pv = figure(toolbar_location=None, plot_width=200, plot_height=p.plot_height+th-10, y_range=p.y_range, title=None, min_border=10, min_border_top=th)
pv.quad(left=0, bottom=vedges[:-1], top=vedges[1:], right=vhist, color="white", line_color="#3A5785")
pv.quad(left=0, bottom=vedges[:-1], top=vedges[1:], right=vzeros, color="#3A5785", alpha=0.6, line_color=None, name="vhist")
pv.ygrid.grid_line_color = None

renderer = pv.select(dict(name="vhist"))
pv_source = renderer[0].data_source

# set up callbacks
def on_selection_change(obj, attr, old, new):
    inds = np.array(new)
    if len(inds) == 0 or len(inds) == len(x):
        hhist = hzeros
        vhist = vzeros
    else:
        hhist, _ = np.histogram(x[inds], bins=hedges)
        vhist, _ = np.histogram(y[inds], bins=vedges)

    ph_source.data["top"] = hhist
    pv_source.data["right"] = vhist

    cursession().store_objects(ph_source, pv_source)

scatter_ds.on_change('selected', on_selection_change)

layout = VBox(HBox(p, pv), HBox(ph, Paragraph()))
show(layout) # open a browser

cursession().poll_document(curdoc(), 0.05)
