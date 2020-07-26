from bokeh.io import output_file, show
from bokeh.plotting import figure

# We set-up a standard figure with two lines
p = figure(plot_width=500, plot_height=200, tools='')
visible_line = p.line([1, 2, 3], [1, 2, 1], line_color="blue")
invisible_line = p.line([1, 2, 3], [2, 1, 2], line_color="pink")

# We hide the x-axis, the x-grid lines, and the pink line
invisible_line.visible = False
p.x_axis.visible = False
p.x_grid.visible = False

output_file("styling_visible_property.html")

show(p)
