# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.models import BoxSelectTool, LassoSelectTool, Paragraph
from bokeh.plotting import (
    curdoc, cursession, figure, output_server, show, hplot, vplot
)

N = 5000

x = np.random.normal(size=N) * 100
y = np.random.normal(size=N) * 100
all_inds = np.arange(len(x))

output_server("selection_histogram")

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

# create the horizontal histogram
hhist, hedges = np.histogram(x, bins=20)
hzeros = np.zeros(len(hedges)-1)
hmax = max(hhist)*1.1

ph = figure(toolbar_location=None, plot_width=p.plot_width, plot_height=200, x_range=p.x_range, y_range=(-hmax, hmax), title=None, min_border=10, min_border_left=50)
ph.quad(bottom=0, left=hedges[:-1], right=hedges[1:], top=hhist, color="white", line_color="#3A5785")
ph.quad(bottom=0, left=hedges[:-1], right=hedges[1:], top=hzeros, color="#3A5785", alpha=0.5, line_color=None, name="hhist")
ph.quad(bottom=0, left=hedges[:-1], right=hedges[1:], top=hzeros, color="#3A5785", alpha=0.1, line_color=None, name="hhist2")
ph.xgrid.grid_line_color = None

ph_source = ph.select(dict(name="hhist"))[0].data_source
ph_source2 = ph.select(dict(name="hhist2"))[0].data_source

# create the vertical histogram
vhist, vedges = np.histogram(y, bins=20)
vzeros = np.zeros(len(vedges)-1)
vmax = max(vhist)*1.1

# need to adjust for toolbar height, unfortunately
th = 42

pv = figure(toolbar_location=None, plot_width=200, plot_height=p.plot_height+th-10, x_range=(-vmax, vmax), y_range=p.y_range, title=None, min_border=10, min_border_top=th)
pv.quad(left=0, bottom=vedges[:-1], top=vedges[1:], right=vhist, color="white", line_color="#3A5785")
pv.quad(left=0, bottom=vedges[:-1], top=vedges[1:], right=vzeros, color="#3A5785", alpha=0.5, line_color=None, name="vhist")
pv.quad(left=0, bottom=vedges[:-1], top=vedges[1:], right=vzeros, color="#3A5785", alpha=0.1, line_color=None, name="vhist2")
pv.ygrid.grid_line_color = None

pv_source = pv.select(dict(name="vhist"))[0].data_source
pv_source2 = pv.select(dict(name="vhist2"))[0].data_source

# set up callbacks
def on_selection_change(obj, attr, old, new):
    inds = np.array(new)
    if len(inds) == 0 or len(inds) == len(x):
        hhist = hzeros
        vhist = vzeros
        hhist2 = hzeros
        vhist2 = vzeros
    else:
        hhist, _ = np.histogram(x[inds], bins=hedges)
        vhist, _ = np.histogram(y[inds], bins=vedges)
        negative_inds = np.ones_like(x, dtype=np.bool)
        negative_inds[inds] = False
        hhist2, _ = np.histogram(x[negative_inds], bins=hedges)
        vhist2, _ = np.histogram(y[negative_inds], bins=vedges)

    ph_source.data["top"] = hhist
    pv_source.data["right"] = vhist
    ph_source2.data["top"] = -hhist2
    pv_source2.data["right"] = -vhist2

    cursession().store_objects(ph_source, pv_source, ph_source2, pv_source2)

scatter_ds.on_change('selected', on_selection_change)

layout = vplot(hplot(p, pv), hplot(ph, Paragraph()))
show(layout)

cursession().poll_document(curdoc(), 0.05)
