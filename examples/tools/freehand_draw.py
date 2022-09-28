from bokeh.models import FreehandDrawTool
from bokeh.plotting import figure, show

p = figure(x_range=(0, 10), y_range=(0, 10), width=400, height=400,
           title='Freehand Draw Tool')

r = p.multi_line([[1, 9]], [[5, 5]], line_width=5, alpha=0.4, color='red')

draw_tool = FreehandDrawTool(renderers=[r], num_objects=3)
p.add_tools(draw_tool)
p.toolbar.active_drag = draw_tool

show(p)
