from bokeh.io import show
from bokeh.models import ColumnDataSource, CustomJSCompare, DataTable, TableColumn

source = ColumnDataSource(data=dict(foo=["AB 1", "AB 10", "AB 2"]))

# sort values like "AB ###" by the numeric portion
sorter = CustomJSCompare(code="""
    const xn = Number(x.split(" ")[1])
    const yn = Number(y.split(" ")[1])
    return (xn == yn) ? 0 : (xn < yn) ? -1 : 1
""")

columns = [TableColumn(field="foo", title="Foo", sorter=sorter)]

table = DataTable(source=source, columns=columns, width=400, height=280)

show(table)
