''' Various kinds of data table (data grid) widgets.

'''
from __future__ import absolute_import

from ...core.enums import DateFormat, FontStyle, NumeralLanguage, TextAlign, RoundingFunction
from ...core.has_props import abstract
from ...core.properties import Bool, Color, Either, Enum, Float, Instance, Int, List, Override, String
from ...model import Model
from ...util.deprecation import deprecated

from ..sources import DataSource, CDSView

from .widget import Widget

@abstract
class CellFormatter(Model):
    ''' Abstract base class for data table's cell formatters.

    '''

@abstract
class CellEditor(Model):
    ''' Abstract base class for data table's cell editors.

    '''

class StringFormatter(CellFormatter):
    ''' Basic string cell formatter.

    '''

    font_style = Enum(FontStyle, default="normal", help="""
    An optional text font style, e.g. bold, italic.
    """)

    text_align = Enum(TextAlign, default="left", help="""
    An optional text align, i.e. left, center or right.
    """)

    text_color = Color(help="""
    An optional text color. See :class:`bokeh.core.properties.Color` for
    details.
    """)

class NumberFormatter(StringFormatter):
    ''' Number cell formatter.

    '''

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

    For the complete specification, see http://numbrojs.com/format.html
    """)

    language = Enum(NumeralLanguage, default="en", help="""
    The language to use for formatting language-specific features (e.g. thousands separator).
    """)

    rounding = Enum(RoundingFunction, help="""
    Rounding functions (round, floor, ceil) and their synonyms (nearest, rounddown, roundup).
    """)

class BooleanFormatter(CellFormatter):
    ''' Boolean (check mark) cell formatter.

    '''

    icon = Enum('check', 'check-circle', 'check-circle-o', 'check-square', 'check-square-o', help="""
    The icon visualizing the check mark.
    """)

class DateFormatter(CellFormatter):
    ''' Date cell formatter.

    '''

    format = Either(Enum(DateFormat), String, default='ISO-8601', help="""
    The date format can be any standard  `strftime`_ format string, as well
    as any of the following predefined format names:

    ================================================ ================== ===================
    Format name(s)                                   Format string      Example Output
    ================================================ ================== ===================
    ``ATOM`` / ``W3C`` / ``RFC-3339`` / ``ISO-8601`` ``"%Y-%m-%d"``     2014-03-01
    ``COOKIE``                                       ``"%a, %d %b %Y"`` Sat, 01 Mar 2014
    ``RFC-850``                                      ``"%A, %d-%b-%y"`` Saturday, 01-Mar-14
    ``RFC-1123`` / ``RFC-2822``                      ``"%a, %e %b %Y"`` Sat, 1 Mar 2014
    ``RSS`` / ``RFC-822`` / ``RFC-1036``             ``"%a, %e %b %y"`` Sat, 1 Mar 14
    ``TIMESTAMP``                                    (ms since epoch)   1393632000000
    ================================================ ================== ===================

    Note that in the table some of the format names are synonymous, with
    identical format names separated by slashes.

    This list of supported `strftime`_ format codes is reproduced below.

    %a
        The abbreviated name of the day of the week according to the
        current locale.

    %A
        The full name of the day of the week according to the current
        locale.

    %b
        The abbreviated month name according to the current locale.

    %B
        The full month name according to the current locale.

    %c
        The preferred date and time representation for the current
        locale.

    %C
        The century number (year/100) as a 2-digit integer.

    %d
        The day of the month as a decimal number (range 01 to 31).

    %D
        Equivalent to %m/%d/%y.  (Americans should note that in many
        other countries %d/%m/%y is rather common. This means that in
        international context this format is ambiguous and should not
        be used.)

    %e
        Like %d, the day of the month as a decimal number, but a
        leading zero is replaced by a space.

    %f
        Microsecond as a decimal number, zero-padded on the left (range
        000000-999999). This is an extension to the set of directives
        available to `timezone`_.

    %F
        Equivalent to %Y-%m-%d (the ISO 8601 date format).

    %G
        The ISO 8601 week-based year with century as a decimal number.
        The 4-digit year corresponding to the ISO week number (see %V).
        This has the same format and value as %Y, except that if the
        ISO week number belongs to the previous or next year, that year
        is used instead.

    %g
        Like %G, but without century, that is, with a 2-digit year (00-99).

    %h
        Equivalent to %b.

    %H
        The hour as a decimal number using a 24-hour clock (range 00
        to 23).

    %I
        The hour as a decimal number using a 12-hour clock (range 01
        to 12).

    %j
        The day of the year as a decimal number (range 001 to 366).

    %k
        The hour (24-hour clock) as a decimal number (range 0 to 23).
        Single digits are preceded by a blank.  (See also %H.)

    %l
        The hour (12-hour clock) as a decimal number (range 1 to 12).
        Single digits are preceded by a blank.  (See also %I.)  (TZ)

    %m
        The month as a decimal number (range 01 to 12).

    %M
        The minute as a decimal number (range 00 to 59).

    %n
        A newline character. Bokeh text does not currently support
        newline characters.

    %N
        Nanosecond as a decimal number, zero-padded on the left (range
        000000000-999999999). Supports a padding width specifier, i.e.
        %3N displays 3 leftmost digits. However, this is only accurate
        to the millisecond level of precision due to limitations of
        `timezone`_.

    %p
        Either "AM" or "PM" according to the given time value, or the
        corresponding strings for the current locale.  Noon is treated
        as "PM" and midnight as "AM".

    %P
        Like %p but in lowercase: "am" or "pm" or a corresponding
        string for the current locale.

    %r
        The time in a.m. or p.m. notation.  In the POSIX locale this
        is equivalent to %I:%M:%S %p.

    %R
        The time in 24-hour notation (%H:%M). For a version including
        the seconds, see %T below.

    %s
        The number of seconds since the Epoch, 1970-01-01 00:00:00
        +0000 (UTC).

    %S
        The second as a decimal number (range 00 to 60).  (The range
        is up to 60 to allow for occasional leap seconds.)

    %t
        A tab character. Bokeh text does not currently support tab
        characters.

    %T
        The time in 24-hour notation (%H:%M:%S).

    %u
        The day of the week as a decimal, range 1 to 7, Monday being 1.
        See also %w.

    %U
        The week number of the current year as a decimal number, range
        00 to 53, starting with the first Sunday as the first day of
        week 01.  See also %V and %W.

    %V
        The ISO 8601 week number (see NOTES) of the current year as a
        decimal number, range 01 to 53, where week 1 is the first week
        that has at least 4 days in the new year.  See also %U and %W.

    %w
        The day of the week as a decimal, range 0 to 6, Sunday being 0.
        See also %u.

    %W
        The week number of the current year as a decimal number, range
        00 to 53, starting with the first Monday as the first day of
        week 01.

    %x
        The preferred date representation for the current locale
        without the time.

    %X
        The preferred time representation for the current locale
        without the date.

    %y
        The year as a decimal number without a century (range 00 to 99).

    %Y
        The year as a decimal number including the century.

    %z
        The +hhmm or -hhmm numeric timezone (that is, the hour and
        minute offset from UTC).

    %Z
        The timezone name or abbreviation.

    %%
        A literal '%' character.

    .. warning::
        The client library BokehJS uses the `timezone`_ library to
        format datetimes. The inclusion of the list below is based on the
        claim that `timezone`_ makes to support "the full compliment
        of GNU date format specifiers." However, this claim has not
        been tested exhaustively against this list. If you find formats
        that do not function as expected, please submit a `github issue`_,
        so that the documentation can be updated appropriately.

    .. _strftime: http://man7.org/linux/man-pages/man3/strftime.3.html
    .. _timezone: http://bigeasy.github.io/timezone/
    .. _github issue: https://github.com/bokeh/bokeh/issues

    """)

class HTMLTemplateFormatter(CellFormatter):
    ''' HTML formatter using a template.
    This uses Underscore's `template` method and syntax.  http://underscorejs.org/#template
    The formatter has access other items in the row via the `dataContext` object passed to the formatter.
    So, for example, if another column in the datasource was named `url`, the template could access it as:

        <a href="<%= url %>"><%= value %></a>

    To use a different set of template delimiters, pass the appropriate values for `evaluate`, `interpolate',
    or `escape`.  See the Underscore `template` documentation for more information.  http://underscorejs.org/#template

    Example: Simple HTML template to format the column value as code.

        HTMLTemplateFormatter(template='<code><%= value %></code>')

    Example: Use values from other columns (`manufacturer` and `model`) to build a hyperlink.

        HTMLTemplateFormatter(template='<a href="https:/www.google.com/search?q=<%= manufacturer %>+<%= model %>" target="_blank"><%= value %></a>')

    '''
    template = String('<%= value %>', help="""
    Template string to be used by Underscore's template method.
    """)

class StringEditor(CellEditor):
    ''' Basic string cell editor with auto-completion.

    '''

    completions = List(String, help="""
    An optional list of completion strings.
    """)

class TextEditor(CellEditor):
    ''' Multi-line string cell editor.

    '''

class SelectEditor(CellEditor):
    ''' Select cell editor.

    '''

    options = List(String, help="""
    The list of options to select from.
    """)

class PercentEditor(CellEditor):
    ''' ``IntEditor`` optimized for editing percentages.

    '''

class CheckboxEditor(CellEditor):
    ''' Boolean value cell editor.

    '''

class IntEditor(CellEditor):
    ''' Spinner-based integer cell editor.

    '''

    step = Int(1, help="""
    The major step value.
    """)

class NumberEditor(CellEditor):
    ''' Spinner-based number cell editor.

    '''

    step = Float(0.01, help="""
    The major step value.
    """)

class TimeEditor(CellEditor):
    ''' Spinner-based time cell editor.

    '''

class DateEditor(CellEditor):
    ''' Calendar-based date cell editor.

    '''

class TableColumn(Model):
    ''' Table column widget.

    '''

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

@abstract
class TableWidget(Widget):
    ''' Abstract base class for data table (data grid) widgets.

    '''

    source = Instance(DataSource, help="""
    The source of data for the widget.
    """)

    view = Instance(CDSView, help="""
    A view into the data source to use when rendering table rows. A default view
    of the entire data source is created if a view is not passed in during
    initialization.
    """)

    def __init__(self, **kw):
        super(TableWidget, self).__init__(**kw)
        if "view" not in kw:
            self.view = CDSView(source=self.source)

class DataTable(TableWidget):
    ''' Two dimensional grid for visualisation and editing large amounts
    of data.

    '''

    @property
    def row_header(self):
        deprecated("DataTable.row_header property is deprecated, use DataTable.index_position instead"\
                   "In the future, accessing DataTable.row_header will result in an AttributeError.")
        return self.index_position is not None

    @row_header.setter
    def row_header(self, val):
        deprecated("DataTable.row_header property is deprecated, use DataTable.index_position instead."\
                   "In the future, accessing DataTable.row_header will result in an AttributeError.")
        if val is True:
            self.index_position = 0
        elif val is False:
            self.index_position = None
        else:
            raise ValueError("Expected True or False for DataTable.row_header, got %s" % val)

    columns = List(Instance(TableColumn), help="""
    The list of child column widgets.
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

    reorderable = Bool(True, help="""
    Allows the reordering of a tables's columns. To reorder a column,
    click and drag a table's header to the desired location in the table.
    The columns on either side will remain in their previous order.
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

    index_position = Int(0, help="""
    Where among the list of columns to insert a column displaying the row
    index. Negative indices are supported, and specify an index position
    from the end of the list of columns (i.e. standard Python behaviour).

    To prevent the index column from being added, set to None.

    If the absolute value of index_position  is larger than the length of
    the columns, then the index will appear at the beginning or end, depending
    on the sign.
    """)

    index_header = String("#", help="""
    The column header to display for the index column, if it is present.
    """)

    index_width = Int(40, help="""
    The width of the index column, if present.
    """)

    scroll_to_selection = Bool(True, help="""
    Whenever a selection is made on the data source, scroll the selected
    rows into the table's viewport if none of the selected rows are already
    in the viewport.
    """)

    height = Override(default=400)
