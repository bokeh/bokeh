from bokeh.plotting import figure, output_file, show
from bokeh.models import BoxEditTool, ColumnDataSource

output_file("tools_box_edit.html")

p = figure(x_range=(0, 10), y_range=(0, 10), width=400, height=400,
           title='Box Edit Tool')

src = ColumnDataSource({
    'x': [5, 2, 8], 'y': [5, 7, 8], 'width': [2, 1, 2],
    'height': [2, 1, 1.5], 'alpha': [0.5, 0.5, 0.5]
})

renderer = p.rect('x', 'y', 'width', 'height', source=src, alpha='alpha')

draw_tool = BoxEditTool(renderers=[renderer], empty_value=1)
p.add_tools(draw_tool)
p.toolbar.active_drag = draw_tool

show(p)
