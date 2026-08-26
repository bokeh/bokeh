from bokeh.models import GeometryDataSource, PolyDrawTool, PolyEditTool
from bokeh.plotting import figure, show

p = figure(x_range=(0, 10), y_range=(0, 10), width=400, height=400,
           title='Poly Edit Tool')

p1 = p.polygons(source=GeometryDataSource(), fill_alpha=0.4)
p2 = p.polygons(
    [{"type": "Polygon", "coordinates": [[[1, 3], [2, 5], [3, 2], [1, 3]]]}],
    fill_color='green', fill_alpha=0.4,
)
c1 = p.scatter([], [], size=10, color='red')

draw_tool = PolyDrawTool(renderers=[p1, p2])
edit_tool = PolyEditTool(renderers=[p1, p2], vertex_renderer=c1)
p.add_tools(draw_tool, edit_tool)
p.toolbar.active_drag = edit_tool

show(p)
