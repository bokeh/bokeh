from __future__ import absolute_import

from ...properties import Bool, Int, Float, String, Color, Instance, Enum, Auto, List
from ...plot_object import PlotObject
from ...enums import FontStyle, TextAlign
from ..sources import DataSource
from ..widget import Widget

class CellFormatter(PlotObject):
    pass

class CellEditor(PlotObject):
    pass

class StringFormatter(CellFormatter):
    font_style = Enum(FontStyle)
    text_align = Enum(TextAlign)
    text_color = Color

class NumberFormatter(StringFormatter):
    format = String("0,0")
    language = Enum("be-nl", "chs", "cs", "da-dk", "de-ch", "de", "en", "en-gb",
        "es-ES", "es", "et", "fi", "fr-CA", "fr-ch", "fr", "hu", "it", "ja",
        "nl-nl", "pl", "pt-br", "pt-pt", "ru", "ru-UA", "sk", "th", "tr", "uk-UA")

class BooleanFormatter(CellFormatter):
    icon = Enum('check', 'check-circle', 'check-circle-o', 'check-square', 'check-square-o')

class StringEditor(CellEditor):
    completions = List(String)

class TextEditor(CellEditor):
    pass

class SelectEditor(CellEditor):
    options = List(String)

class PercentEditor(CellEditor):
    pass

class CheckboxEditor(CellEditor):
    pass

class IntEditor(CellEditor):
    step = Int(1)

class NumberEditor(CellEditor):
    step = Float(0.01)

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
    sortable = Bool(True)
    default_sort = Enum("ascending", "descending")

class TableWidget(Widget):
    source = Instance(DataSource)

class DataTable(TableWidget):
    columns = List(Instance(TableColumn))
    width = Int(None)                # px, optional
    height = Int(400) | Auto         # px, required, use "auto" only for small data
    fit_columns = Bool(True)
    sortable = Bool(True)
    editable = Bool(False)
    selectable = Bool(True) | Enum("checkbox")
    row_headers = Bool(True)
