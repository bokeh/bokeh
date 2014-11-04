from __future__ import absolute_import

from ...properties import HasProps, Instance, List
from ..sources import DataSource
from ..widget import Widget

class TableWidget(Widget):
    source = Instance(DataSource)

class TableColumn(HasProps):
    pass

class DataTable(TableWidget):
    columns = List(Instance(TableColumn))
