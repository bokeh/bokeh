from bokeh.models import ColumnDataSource, DataTable, PointDrawTool, TableColumn
from bokeh.plotting import Column, figure, show

p = figure(x_range=(0, 10), y_range=(0, 10), tools=[],
           title='Point Draw Tool')
p.background_fill_color = 'lightgrey'

source = ColumnDataSource(dict(
    x=[1, 5, 9],
    y=[1, 5, 9],
    color=['red', 'green', 'yellow'],
))
source.default_values["color"] = "purple"

r = p.scatter(x='x', y='y', source=source, color='color', size=10)

columns = [
    TableColumn(field="x", title="x"),
    TableColumn(field="y", title="y"),
    TableColumn(field='color', title='color'),
]
table = DataTable(source=source, columns=columns, editable=True, height=200)

draw_tool = PointDrawTool(renderers=[r])
p.add_tools(draw_tool)
p.toolbar.active_tap = draw_tool

show(Column(p, table))
