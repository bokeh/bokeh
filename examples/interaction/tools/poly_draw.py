from bokeh.models import GeometryDataSource, PolyDrawTool
from bokeh.plotting import figure, show

p = figure(x_range=(0, 10), y_range=(0, 10), width=400, height=400,
           title='Poly Draw Tool')

source = GeometryDataSource([
    {"type": "Polygon", "coordinates": [[[2, 2], [5, 8], [8, 2], [2, 2]]]},
])
r1 = p.polygons(source=source, line_width=0, alpha=0.4)

r2 = p.multi_line([[1, 9]], [[5, 5]], line_width=5, alpha=0.4, color='red')

draw_tool_r1 = PolyDrawTool(renderers=[r1])
p.toolbar.active_drag = draw_tool_r1

draw_tool_r2 = PolyDrawTool(renderers=[r2])
p.add_tools(draw_tool_r1, draw_tool_r2)

show(p)
