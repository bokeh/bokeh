import numpy as np

from bokeh.models import BoxSelectTool, BoxZoomTool, LassoSelectTool
from bokeh.plotting import figure, output_file, show

output_file("styling_tool_overlays.html")

x = np.random.random(size=200)
y = np.random.random(size=200)

# Basic plot setup
plot = figure(width=400, height=400, title='Select and Zoom',
              tools="box_select,box_zoom,lasso_select,reset")

plot.circle(x, y, size=5)

select_overlay = plot.select_one(BoxSelectTool).overlay

select_overlay.fill_color = "firebrick"
select_overlay.line_color = None

zoom_overlay = plot.select_one(BoxZoomTool).overlay

zoom_overlay.line_color = "olive"
zoom_overlay.line_width = 8
zoom_overlay.line_dash = "solid"
zoom_overlay.fill_color = None

plot.select_one(LassoSelectTool).overlay.line_dash = [10, 10]

show(plot)
