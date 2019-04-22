from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import StringFormatter, TableColumn, GroupingInfo, SumAggregator, DataCube
from bokeh.resources import INLINE
from bokeh.util.browser import view

source = ColumnDataSource(data=dict(
    d0=['A', 'E', 'E', 'E', 'J', 'L', 'M'],
    d1=['B', 'D', 'D', 'H', 'K', 'L', 'N'],
    d2=['C', 'F', 'G', 'H', 'K', 'L', 'O'],
    px=[10, 20, 30, 40, 50, 60, 70],
))

target = ColumnDataSource(data=dict(row_indices=[], labels=[]))

formatter = StringFormatter(font_style='bold')

columns = [
    TableColumn(field='d2', title='Name', width=80, sortable=False, formatter=formatter),
    TableColumn(field='px', title='Price', width=40, sortable=False),
]

grouping = [
    GroupingInfo(getter='d0', aggregators=[SumAggregator(field_='px')]),
    GroupingInfo(getter='d1', aggregators=[SumAggregator(field_='px')])
]

cube = DataCube(source=source, columns=columns, grouping=grouping, target=target)

doc = Document()
doc.add_root(cube)

if __name__ == '__main__':
    doc.validate()
    filename = "data_cube.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Demonstration of Data Cube with Aggregations"))
    print("Wrote", filename)
    view(filename)
