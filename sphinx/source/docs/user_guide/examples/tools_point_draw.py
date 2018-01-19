from bokeh.plotting import figure, output_file, show, Row
from bokeh.models import DataTable, TableColumn, PointDrawTool, ColumnDataSource

output_file("tools_point_draw.html")

source = ColumnDataSource({
    'x': [1, 5, 9], 'y': [1, 5, 9], 'color': ['red', 'green', 'blue']
})

p = figure(x_range=(0, 10), y_range=(0, 10), tools=[])

renderer = p.scatter(x='x', y='y', source=source, color='color', size=10)
columns = [TableColumn(field="x", title="x"),
           TableColumn(field="y", title="y"),
           TableColumn(field='color', title='color')]
table = DataTable(source=source, columns=columns, editable=True)

p.add_tools(PointDrawTool(renderers=[renderer], empty_value='black'))

show(Row(p, table))
