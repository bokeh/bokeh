from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import ColumnDataSource, DataTable, TableColumn, Selection

data = dict(x=list(range(10)))
selected = Selection(indices=[1, 2])
source = ColumnDataSource(data=data, selected=selected)
columns = [TableColumn(field="x", title="X")]
data_table = DataTable(source=source, columns=columns)

save(data_table)
