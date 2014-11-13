from __future__ import absolute_import

from ...properties import Bool, Int, String, Instance, Enum, List, Either
from ...plot_object import PlotObject
from ..sources import DataSource
from ..widget import Widget

class TableWidget(Widget):
    source = Instance(DataSource)

class TableColumn(PlotObject):
    field = String
    title = String
    width = Int(300) # px

class DataTable(TableWidget):
    columns = List(Instance(TableColumn))
    width = Int(None)                        # px, optional
    height = Either(Int(400), Enum("auto"))  # px, required, use "auto" only for small data
    fit_columns = Bool(True)
