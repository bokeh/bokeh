from bokeh.plotting import figure, output_file, show
from bokeh.models import PolyDrawTool

output_file("tools_poly_draw.html")

p = figure(x_range=(0, 10), y_range=(0, 10), width=400, height=400,
           title='Poly Draw Tool')

p1 = p.patches([[2, 5, 8]], [[2, 8, 2]], line_width=0, alpha=0.4)
l1 = p.multi_line([[1, 9]], [[5, 5]], line_width=5, alpha=0.4, color='red')

draw_tool_p1 = PolyDrawTool(renderers=[p1])
draw_tool_l1 = PolyDrawTool(renderers=[l1])
p.add_tools(draw_tool_p1, draw_tool_l1)
p.toolbar.active_drag = draw_tool_p1

show(p)
