from bokeh.io import show
from bokeh.models import (ColumnDataSource, DataCube, GroupingInfo,
                          StringFormatter, SumAggregator, TableColumn)

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
    GroupingInfo(getter='d1', aggregators=[SumAggregator(field_='px')]),
]

cube = DataCube(source=source, columns=columns, grouping=grouping, target=target)

show(cube)
