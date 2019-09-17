## Bokeh server for Data-Table

from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import DataTable,TableColumn
from bokeh.plotting import figure

x=[3,4,6,12,10,1]
y=[7,1,3,4,1,6]

source = ColumnDataSource(data=dict(x=x, y=y))

plot_figure = figure(title='Data-Table',plot_height=450, plot_width=600,
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
    width=80,
    editable=True,
)

layout=row(plot_figure,data_table)

curdoc().add_root(layout)
curdoc().title = "Data-Table Bokeh Server"
