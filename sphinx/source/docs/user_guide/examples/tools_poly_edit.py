from bokeh.plotting import figure, output_file, show
from bokeh.models import PolyDrawTool, PolyEditTool

output_file("tools_poly_edit.html")

p = figure(x_range=(0, 10), y_range=(0, 10), width=400, height=400,
           title='Poly Edit Tool')

p1 = p.patches([], [], fill_alpha=0.4)
p2 = p.patches([[1, 2, 3]], [[3, 5, 2]], fill_color='green', fill_alpha=0.4)
c1 = p.circle([], [], size=10, color='red')

draw_tool = PolyDrawTool(renderers=[p1, p2])
edit_tool = PolyEditTool(renderers=[p1, p2], vertex_renderer=c1)
p.add_tools(draw_tool, edit_tool)
p.toolbar.active_drag = edit_tool

show(p)
