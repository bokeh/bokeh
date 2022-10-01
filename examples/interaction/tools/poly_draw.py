from bokeh.models import PolyDrawTool
from bokeh.plotting import figure, show

p = figure(x_range=(0, 10), y_range=(0, 10), width=400, height=400,
           title='Poly Draw Tool')

r1 = p.patches([[2, 5, 8]], [[2, 8, 2]], line_width=0, alpha=0.4)

r2 = p.multi_line([[1, 9]], [[5, 5]], line_width=5, alpha=0.4, color='red')

draw_tool_r1 = PolyDrawTool(renderers=[r1])
p.toolbar.active_drag = draw_tool_r1

draw_tool_r2 = PolyDrawTool(renderers=[r2])
p.add_tools(draw_tool_r1, draw_tool_r2)

show(p)
