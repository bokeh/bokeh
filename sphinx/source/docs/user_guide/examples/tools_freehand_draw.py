from bokeh.plotting import figure, output_file, show
from bokeh.models import FreehandDrawTool

output_file("tools_box_edit.html")

p = figure(x_range=(0, 10), y_range=(0, 10), width=400, height=400,
           title='Freehand Draw Tool')

renderer = p.multi_line([[1, 9]], [[5, 5]], line_width=5, alpha=0.4, color='red')

draw_tool = FreehandDrawTool(renderers=[renderer], num_objects=3)
p.add_tools(draw_tool)
p.toolbar.active_drag = draw_tool

show(p)
