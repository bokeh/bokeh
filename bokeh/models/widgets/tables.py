from __future__ import absolute_import

from ...properties import Int, String, Instance, List
from ...plot_object import PlotObject
from ..sources import DataSource
from ..widget import Widget

class TableWidget(Widget):
    source = Instance(DataSource)

class TableColumn(PlotObject):
    field = String
    title = String
    width = Int(None)

class DataTable(TableWidget):
    columns = List(Instance(TableColumn))
    width = Int
    height = Int
