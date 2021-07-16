## Bokeh server for Data-Table

from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource, DataTable, TableColumn, Toggle
from bokeh.plotting import figure

x=[3,4,6,12,10,1]
y=[7,1,3,4,1,6]

source = ColumnDataSource(data=dict(x=x, y=y))

plot_figure = figure(title='Data-Table',height=450, width=600,
              tools="save,reset", toolbar_location="below")

plot_figure.scatter('x', 'y', source=source, size=10)

columns = [
    TableColumn(field="x", title="x"),
    TableColumn(field="y", title="y")
]
data_table = DataTable(
    source=source,
    columns=columns,
    index_position=None,
    # width=80,
    autosize_mode="fit_columns",
    editable=True,
)

toggle = Toggle()

def cb(attr, old, new):
    columns[0].visible = toggle.active

toggle.on_change('active', cb)

layout=row(plot_figure, data_table, toggle)

curdoc().add_root(layout)
curdoc().title = "Data-Table Bokeh Server"
