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

plot.select_one(BoxSelectTool).overlay.fill_color = "firebrick"
plot.select_one(BoxSelectTool).overlay.line_color = None

plot.select_one(BoxZoomTool).overlay.line_color = "olive"
plot.select_one(BoxZoomTool).overlay.line_width = 8
plot.select_one(BoxZoomTool).overlay.line_dash = "solid"
plot.select_one(BoxZoomTool).overlay.fill_color = None

plot.select_one(LassoSelectTool).overlay.line_dash = [10, 10]

show(plot)