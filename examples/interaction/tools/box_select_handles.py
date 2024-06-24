import numpy as np

from bokeh.layouts import row
from bokeh.models import BoxSelectTool
from bokeh.palettes import Spectral11
from bokeh.plotting import figure, show

N = 4000
x = np.random.random(size=N)*100
y = np.random.random(size=N)*100
radii = np.random.random(size=N)*1.5
colors = np.random.choice(Spectral11, size=N)

TOOLS="pan,box_select,wheel_zoom,zoom_in,zoom_out,undo,redo,reset,save"

p0 = figure(tools=TOOLS, active_drag="box_select", width=400, height=400, title="Box selection overlay with handles")
p0.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

box_select = p0.select(BoxSelectTool)
box_select.persistent = True
box_select.overlay.hover_fill_color = "yellow"
box_select.overlay.use_handles = True
box_select.overlay.handles.all.hover_fill_color = "red"
box_select.overlay.handles.all.hover_fill_alpha = 0.7

p1 = figure(tools=TOOLS, active_drag="box_select", width=400, height=400, title="Box selection overlay without handles")
p1.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

box_select = p1.select(BoxSelectTool)
box_select.persistent = True
box_select.overlay.hover_fill_color = "green"

show(row([p0, p1]))
