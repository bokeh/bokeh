from bokeh.io import save
from bokeh.models import ColumnDataSource, DataTable, TableColumn

data = dict(x=list(range(10)))
source = ColumnDataSource(data=data)
source.selected.indices = [1, 2]
columns = [TableColumn(field="x", title="X")]
data_table = DataTable(source=source, columns=columns)

save(data_table)
