from __future__ import print_function

from bokeh.objects import ColumnDataSource
from bokeh.widgetobjects import TableColumn, HandsonTable, PivotTable, HBox
from bokeh.session import PlotServerSession
from bokeh.sampledata.autompg import autompg

source = ColumnDataSource(autompg)

fields = zip(autompg.columns, map(str, autompg.dtypes))
columns = [ TableColumn(data=column, type="text" if dtype == "object" else "numeric", header=column) for column, dtype in fields ]

data_table = HandsonTable(source=source, columns=columns)
pivot_table = PivotTable(source=source, fields=[ dict(name=field, dtype=dtype) for field, dtype in fields ])

hbox = HBox(children=[data_table, pivot_table])

try:
    session = PlotServerSession(serverloc="http://localhost:5006", username="defaultuser", userapikey="nokey")
except requests.exceptions.ConnectionError:
    print("ERROR: This example requires the plot server. Please make sure plot server is running, by executing 'bokeh-server'")
    sys.exit(1)

session.use_doc('data_tables_server')
session.add_plot(hbox)
session.store_all()

if __name__ == "__main__":
    print("\nPlease visit http://localhost:5006/bokeh to see the plots")
