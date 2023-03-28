import numpy as np

from bokeh.io import curdoc, show
from bokeh.layouts import column
from bokeh.models import ColorBar, ColumnDataSource, CustomJS, PointDrawTool, Slider
from bokeh.palettes import Sunset8
from bokeh.plotting import figure
from bokeh.transform import linear_cmap

x =  np.random.random(100)*3
y  = np.random.random(100)*2

z = 1.3*np.exp(-2.5*((x-1.3)**2 + (y-0.8)**2)) - 1.2*np.exp(-2*((x-1.8)**2 + (y-1.3)**2))

source = ColumnDataSource(data=dict(
    x=x,
    y=y,
    z=z,
    pxs=[[] for _ in range(100)],
    pys=[[] for _ in range(100)],
))

p = figure(width=800, height=400, x_range=(-.5, 3.5), y_range=(-0.5, 2.5), title="Move some points!")
cmap = linear_cmap(field_name="z", palette=Sunset8, low=-1, high=1)
r = p.scatter(x="x", y="y", fill_color=cmap, line_alpha=cmap, size=8, source=source)

color_bar = ColorBar(color_mapper=cmap.transform, label_standoff=12)
p.add_layout(color_bar, "right")

pdt = PointDrawTool(renderers=[r], num_objects=50)
p.toolbar.active_multi = pdt
p.add_tools(pdt)

vr = p.patches(xs="pxs", ys="pys", fill_color=cmap, line_color="black", fill_alpha=0.5, source=source)

slider = Slider(title="Buffer extent", value=0, start=0, end=1, step=0.1)

cb = CustomJS.from_file("d3-voronoi.mjs", source=source, slider=slider)

source.js_on_change("data", cb)
slider.js_on_change("value", cb)

curdoc().js_on_event("document_ready", cb)

show(column([p, slider]))
