''' Display data source columns in an interactive table.

.. bokeh-example-metadata::
    :title: Data table
    :keywords: data table, interaction, widgets
    :apis: bokeh.models.ColumnDataSource, bokeh.models.DataTable, bokeh.models.DateFormatter, bokeh.models.TableColumn
    :gallery:
    :thumbnail-alt: A simple example of a data table widget with multiple columns.
'''

from datetime import date
from random import randint

from bokeh.io import show
from bokeh.models import ColumnDataSource, DataTable, DateFormatter, TableColumn

data = dict(
        dates=[date(2014, 3, i+1) for i in range(10)],
        downloads=[randint(0, 100) for i in range(10)],
    )
source = ColumnDataSource(data)

columns = [
        TableColumn(field="dates", title="Date", formatter=DateFormatter()),
        TableColumn(field="downloads", title="Downloads"),
    ]
data_table = DataTable(source=source, columns=columns, width=400, height=280)

show(data_table)
