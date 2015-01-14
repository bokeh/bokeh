from __future__ import absolute_import

from ...properties import Bool, Int, Float, String, Color, Instance, Enum, Auto, List, Either
from ...plot_object import PlotObject
from ...enums import FontStyle, TextAlign, DateFormat
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

class DateFormatter(CellFormatter):
    """Format a date according to a format string.

       The format can be combinations of the following::

       `d`     - day of month (no leading zero)
       `dd`    - day of month (two digit)
       `o`     - day of year (no leading zeros)
       `oo`    - day of year (three digit)
       `D`     - day name short
       `DD`    - day name long
       `m`     - month of year (no leading zero)
       `mm`    - month of year (two digit)
       `M`     - month name short
       `MM`    - month name long
       `y`     - year (two digit)
       `yy`    - year (four digit)
       `@`     - Unix timestamp (ms since 01/01/1970)
       `!`     - Windows ticks (100ns since 01/01/0001)
       `"..."` - literal text
       `''`    - single quote
    """
    format = Either(Enum(DateFormat), String, default='yy M d')

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
    height = Either(Int(400), Auto)  # px, required, use "auto" only for small data
    fit_columns = Bool(True)
    sortable = Bool(True)
    editable = Bool(False)
    selectable = Either(Bool(True), Enum("checkbox"))
    row_headers = Bool(True)
