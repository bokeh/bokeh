from bokeh.plotting import figure, output_file, show, Column
from bokeh.models import DataTable, TableColumn, PointDrawTool, ColumnDataSource

output_file("tools_point_draw.html")

p = figure(x_range=(0, 10), y_range=(0, 10), tools=[],
           title='Point Draw Tool')
p.background_fill_color = 'lightgrey'

source = ColumnDataSource({
    'x': [1, 5, 9], 'y': [1, 5, 9], 'color': ['red', 'green', 'yellow']
})

renderer = p.scatter(x='x', y='y', source=source, color='color', size=10)
columns = [TableColumn(field="x", title="x"),
           TableColumn(field="y", title="y"),
           TableColumn(field='color', title='color')]
table = DataTable(source=source, columns=columns, editable=True, height=200)

draw_tool = PointDrawTool(renderers=[renderer], empty_value='black')
p.add_tools(draw_tool)
p.toolbar.active_tap = draw_tool

show(Column(p, table))
