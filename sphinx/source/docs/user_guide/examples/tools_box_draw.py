from bokeh.plotting import figure, output_file, show
from bokeh.models import BoxDrawTool, ColumnDataSource

output_file("tools_box_draw.html")

p = figure(x_range=(0, 10), y_range=(0, 10), width=400, height=400)

src = ColumnDataSource({
    'x': [5, 2, 8], 'y': [5, 7, 8], 'width': [2, 1, 2],
    'height': [2, 1, 1.5], 'alpha': [0.5, 0.5, 0.5]
})

renderer = p.rect('x', 'y', 'width', 'height', source=src, alpha='alpha')

p.add_tools(BoxDrawTool(renderers=[renderer], empty_value=1))

show(p)
