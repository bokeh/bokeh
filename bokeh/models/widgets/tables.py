"""

"""
from __future__ import absolute_import

from ...properties import Bool, Int, Float, String, Color, Instance, Enum, Auto, List, Either
from ...plot_object import PlotObject
from ...enums import FontStyle, TextAlign, DateFormat
from ..sources import DataSource
from ..widget import Widget

class CellFormatter(PlotObject):
    """

    """

class CellEditor(PlotObject):
    """

    """

class StringFormatter(CellFormatter):
    """

    """

    font_style = Enum(FontStyle, help="""

    """)

    text_align = Enum(TextAlign, help="""

    """)

    text_color = Color(help="""

    """)

class NumberFormatter(StringFormatter):
    """

    """

    format = String("0,0", help="""

    """)

    language = Enum("be-nl", "chs", "cs", "da-dk", "de-ch", "de", "en", "en-gb",
        "es-ES", "es", "et", "fi", "fr-CA", "fr-ch", "fr", "hu", "it", "ja",
        "nl-nl", "pl", "pt-br", "pt-pt", "ru", "ru-UA", "sk", "th", "tr", "uk-UA", help="""

    """)

class BooleanFormatter(CellFormatter):
    """

    """

    icon = Enum('check', 'check-circle', 'check-circle-o', 'check-square', 'check-square-o', help="""

    """)

class DateFormatter(CellFormatter):
    """ Format a date according to a format string.

    The format can be combinations of the following:

    d
        day of month (no leading zero)

    dd
        day of month (two digit)

    o
        day of year (no leading zeros)

    oo
        day of year (three digit)

    D
        day name short

    DD
        day name long

    m
        month of year (no leading zero)

    mm
        month of year (two digit)

    M
        month name short

    MM
        month name long

    y
        year (two digit)

    yy
        year (four digit)

    @
        Unix timestamp (ms since 01/01/1970)

    !
        Windows ticks (100ns since 01/01/0001)

    "..."
        literal text

    ''
        single quote

    """

    format = Either(Enum(DateFormat), String, default='yy M d', help="""

    """)

class StringEditor(CellEditor):
    """

    """

    completions = List(String, help="""

    """)

class TextEditor(CellEditor):
    """

    """

class SelectEditor(CellEditor):
    """

    """

    options = List(String, help="""

    """)

class PercentEditor(CellEditor):
    """

    """

class CheckboxEditor(CellEditor):
    """

    """

class IntEditor(CellEditor):
    """

    """

    step = Int(1, help="""

    """)

class NumberEditor(CellEditor):
    """

    """

    step = Float(0.01, help="""

    """)

class TimeEditor(CellEditor):
    """

    """

class DateEditor(CellEditor):
    """

    """

class TableColumn(PlotObject):
    """

    """

    field = String(help="""

    """)

    title = String(help="""

    """)

    width = Int(300, help="""

    """) # px

    formatter = Instance(CellFormatter, lambda: StringFormatter(), help="""

    """)

    editor = Instance(CellEditor, lambda: StringEditor(), help="""

    """)

    sortable = Bool(True, help="""

    """)

    default_sort = Enum("ascending", "descending", help="""

    """)

class TableWidget(Widget):
    """

    """

    source = Instance(DataSource, help="""

    """)

class DataTable(TableWidget):
    """

    """

    columns = List(Instance(TableColumn), help="""

    """)

    width = Int(None, help="""

    """)                # px, optional

    height = Either(Int(400), Auto, help="""

    """)  # px, required, use "auto" only for small data

    fit_columns = Bool(True, help="""

    """)

    sortable = Bool(True, help="""

    """)

    editable = Bool(False, help="""

    """)

    selectable = Either(Bool(True), Enum("checkbox"), help="""

    """)

    row_headers = Bool(True, help="""

    """)
