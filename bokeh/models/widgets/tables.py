""" Various kinds of data table (data grid) widgets.

"""
from __future__ import absolute_import

from ...properties import Bool, Int, Float, String, Color, Instance, Enum, Auto, List, Either
from ...plot_object import PlotObject
from ...enums import FontStyle, TextAlign, DateFormat, RoundingFunction, NumeralLanguage
from ..sources import DataSource
from ..widget import Widget

class CellFormatter(PlotObject):
    """ Abstract base class for data table's cell formatters.

    """

class CellEditor(PlotObject):
    """ Abstract base class for data table's cell editors.

    """

class StringFormatter(CellFormatter):
    """ Basic string cell formatter.

    """

    font_style = Enum(FontStyle, help="""
    An optional text font style, e.g. bold, italic.
    """)

    text_align = Enum(TextAlign, help="""
    An optional text align, i.e. left, center or right.
    """)

    text_color = Color(help="""
    An optional text color. See :class:`bokeh.properties.Color` for
    details.
    """)

class NumberFormatter(StringFormatter):
    """ Number cell formatter.

    """

    format = String("0,0", help="""
    The number format, as defined in the following tables:

    **NUMBERS**:

    ============ ============== ===============
    Number       Format         String
    ============ ============== ===============
    10000        '0,0.0000'     10,000.0000
    10000.23     '0,0'          10,000
    10000.23     '+0,0'         +10,000
    -10000       '0,0.0'        -10,000.0
    10000.1234   '0.000'        10000.123
    10000.1234   '0[.]00000'    10000.12340
    -10000       '(0,0.0000)'   (10,000.0000)
    -0.23        '.00'          -.23
    -0.23        '(.00)'        (.23)
    0.23         '0.00000'      0.23000
    0.23         '0.0[0000]'    0.23
    1230974      '0.0a'         1.2m
    1460         '0 a'          1 k
    -104000      '0a'           -104k
    1            '0o'           1st
    52           '0o'           52nd
    23           '0o'           23rd
    100          '0o'           100th
    ============ ============== ===============

    **CURRENCY**:

    =========== =============== =============
    Number      Format          String
    =========== =============== =============
    1000.234    '$0,0.00'       $1,000.23
    1000.2      '0,0[.]00 $'    1,000.20 $
    1001        '$ 0,0[.]00'    $ 1,001
    -1000.234   '($0,0)'        ($1,000)
    -1000.234   '$0.00'         -$1000.23
    1230974     '($ 0.00 a)'    $ 1.23 m
    =========== =============== =============

    **BYTES**:

    =============== =========== ============
    Number          Format      String
    =============== =========== ============
    100             '0b'        100B
    2048            '0 b'       2 KB
    7884486213      '0.0b'      7.3GB
    3467479682787   '0.000 b'   3.154 TB
    =============== =========== ============

    **PERCENTAGES**:

    ============= ============= ===========
    Number        Format        String
    ============= ============= ===========
    1             '0%'          100%
    0.974878234   '0.000%'      97.488%
    -0.43         '0 %'         -43 %
    0.43          '(0.000 %)'   43.000 %
    ============= ============= ===========

    **TIME**:

    ============ ============== ============
    Number       Format         String
    ============ ============== ============
    25           '00:00:00'     0:00:25
    238          '00:00:00'     0:03:58
    63846        '00:00:00'     17:44:06
    ============ ============== ============
    """)

    language = Enum(NumeralLanguage, default="en", help="""
    The language to use for formatting language-specific features (e.g. thousands separator).
    """)

    rounding = Enum(RoundingFunction, help="""
    Rounding functions (round, floor, ceil) and their synonyms (nearest, rounddown, roundup).
    """)

class BooleanFormatter(CellFormatter):
    """ Boolean (check mark) cell formatter.

    """

    icon = Enum('check', 'check-circle', 'check-circle-o', 'check-square', 'check-square-o', help="""
    The icon visualizing the check mark.
    """)

class DateFormatter(CellFormatter):
    """ Date cell formatter.

    """

    format = Either(Enum(DateFormat), String, default='yy M d', help="""
    The date format can be combinations of the following:

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
    """)

class StringEditor(CellEditor):
    """ Basic string cell editor with auto-completion.

    """

    completions = List(String, help="""
    An optional list of completion strings.
    """)

class TextEditor(CellEditor):
    """ Multi-line string cell editor.

    """

class SelectEditor(CellEditor):
    """ Select cell editor.

    """

    options = List(String, help="""
    The list of options to select from.
    """)

class PercentEditor(CellEditor):
    """ ``IntEditor`` optimized for editing percentages.

    """

class CheckboxEditor(CellEditor):
    """ Boolean value cell editor.

    """

class IntEditor(CellEditor):
    """ Spinner-based integer cell editor.

    """

    step = Int(1, help="""
    The major step value.
    """)

class NumberEditor(CellEditor):
    """ Spinner-based number cell editor.

    """

    step = Float(0.01, help="""
    The major step value.
    """)

class TimeEditor(CellEditor):
    """ Spinner-based time cell editor.

    """

class DateEditor(CellEditor):
    """ Calendar-based date cell editor.

    """

class TableColumn(PlotObject):
    """ Table column widget.

    """

    field = String(help="""
    The name of the field mapping to a column in the data source.
    """)

    title = String(help="""
    The title of this column. If not set, column's data field is
    used instead.
    """)

    width = Int(300, help="""
    The width or maximum width (depending on data table's configuration)
    in pixels of this column.
    """)

    formatter = Instance(CellFormatter, lambda: StringFormatter(), help="""
    The cell formatter for this column. By default, a simple string
    formatter is used.
    """)

    editor = Instance(CellEditor, lambda: StringEditor(), help="""
    The cell editor for this column. By default, a simple string editor
    is used.
    """)

    sortable = Bool(True, help="""
    Whether this column is sortable or not. Note that data table has
    to have sorting enabled to allow sorting in general.
    """)

    default_sort = Enum("ascending", "descending", help="""
    The default sorting order. By default ``ascending`` order is used.
    """)

class TableWidget(Widget):
    """ Abstract base class for data table (data grid) widgets.

    """

    source = Instance(DataSource, help="""
    The source of data for the widget.
    """)

class DataTable(TableWidget):
    """ Two dimensional grid for visualisation and editing large amounts
    of data.

    """

    columns = List(Instance(TableColumn), help="""
    The list of child column widgets.
    """)

    width = Int(None, help="""
    Optional width in pixels of the table widget. By default, uses all
    horizontal space available.
    """)

    height = Either(Int(400), Auto, help="""
    Height in pixels of the table widget. Use ``Auto`` to make the widget
    adjust its height automatically. Note that ``Auto`` is inefficient for
    large amounts of data, so should be used with care.
    """)

    fit_columns = Bool(True, help="""
    Whether columns should be fit to the available width. This results in no
    horizontal scrollbar showing up, but data can get unreadable if there is
    no enough space available. If set to ``True``, columns' width is
    understood as maximum width.
    """)

    sortable = Bool(True, help="""
    Allows to sort table's contents. By default natural order is preserved.
    To sort a column, click on it's header. Clicking one more time changes
    sort direction. Use Ctrl + click to return to natural order. Use
    Shift + click to sort multiple columns simultaneously.
    """)

    editable = Bool(False, help="""
    Allows to edit table's contents. Needs cell editors to be configured on
    columns that are required to be editable.
    """)

    selectable = Either(Bool(True), Enum("checkbox"), help="""
    Whether a table's rows can be selected or not. Using ``checkbox`` is
    equivalent  to ``True``, but makes selection visible through a checkbox
    for each row,  instead of highlighting rows. Multiple selection is
    allowed and can be achieved by either clicking multiple checkboxes (if
    enabled) or using Shift + click on rows.
    """)

    row_headers = Bool(True, help="""
    Enable or disable row headers, i.e. the index column.
    """)
