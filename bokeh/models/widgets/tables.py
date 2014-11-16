from __future__ import absolute_import

from ...properties import Bool, Int, Float, String, Instance, Enum, List, Either
from ...plot_object import PlotObject
from ..sources import DataSource
from ..widget import Widget

class CellFormatter(PlotObject):
    pass

class CellEditor(PlotObject):
    pass

class StringFormatter(CellFormatter):
    pass

class CheckmarkFormatter(CellFormatter):
    pass

class StringEditor(CellEditor):
    pass

class TextEditor(CellEditor):
    pass

class PercentEditor(CellEditor):
    pass

class CheckboxEditor(CellEditor):
    pass

class IntegerEditor(CellEditor):
    increment = Int(1)

class NumberEditor(CellEditor):
    increment = Float(0.01)

class TimeEditor(CellEditor):
    pass

class DateEditor(CellEditor):
    pass

class TableColumn(PlotObject):
    field = String
    title = String
    width = Int(300) # px
    formatter = Instance(CellFormatter, lambda: StringFormatter())
    editor = Instance(CellEditor, lambda: StringEditor())

class TableWidget(Widget):
    source = Instance(DataSource)

class DataTable(TableWidget):
    columns = List(Instance(TableColumn))
    width = Int(None)                        # px, optional
    height = Either(Int(400), Enum("auto"))  # px, required, use "auto" only for small data
    fit_columns = Bool(True)
    editable = Bool(False)
