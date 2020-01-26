#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Models for controlling the text and visual formatting of tick
labels on Bokeh plot axes.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.enums import LatLon, NumeralLanguage, RoundingFunction
from ..core.has_props import abstract
from ..core.properties import (
    AnyRef,
    Auto,
    Bool,
    Dict,
    Either,
    Enum,
    Instance,
    Int,
    List,
    String,
)
from ..core.validation import error
from ..core.validation.errors import MISSING_MERCATOR_DIMENSION
from ..model import Model
from ..util.string import format_docstring
from .tickers import Ticker

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'TickFormatter',
    'BasicTickFormatter',
    'MercatorTickFormatter',
    'NumeralTickFormatter',
    'PrintfTickFormatter',
    'LogTickFormatter',
    'CategoricalTickFormatter',
    'FuncTickFormatter',
    'DatetimeTickFormatter',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _DATETIME_TICK_FORMATTER_HELP(field):
    return """
    Formats for displaying datetime values in the %s range.

    See the :class:`~bokeh.models.formatters.DatetimeTickFormatter` help for a list of all supported formats.
    """ % field

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class TickFormatter(Model):
    ''' A base class for all tick formatter types.

    '''
    pass

class BasicTickFormatter(TickFormatter):
    ''' Display tick values from continuous ranges as "basic numbers",
    using scientific notation when appropriate by default.

    '''
    precision = Either(Auto, Int, help="""
    How many digits of precision to display in tick labels.
    """)

    use_scientific = Bool(True, help="""
    Whether to ever display scientific notation. If ``True``, then
    when to use scientific notation is controlled by ``power_limit_low``
    and ``power_limit_high``.
    """)

    power_limit_high = Int(5, help="""
    Limit the use of scientific notation to when::

        log(x) >= power_limit_high

    """)

    power_limit_low = Int(-3, help="""
    Limit the use of scientific notation to when::

        log(x) <= power_limit_low

    """)

class MercatorTickFormatter(BasicTickFormatter):
    ''' A ``TickFormatter`` for values in WebMercator units.

    Some map plot types internally use WebMercator to describe coordinates,
    plot bounds, etc. These units are not very human-friendly. This tick
    formatter will convert WebMercator units into Latitude and Longitude
    for display on axes.

    '''

    dimension = Enum(LatLon, default=None, help="""
    Specify whether to format ticks for Latitude or Longitude.

    Projected coordinates are not separable, computing Latitude and Longitude
    tick labels from Web Mercator requires considering coordinates from both
    dimensions together. Use this property to specify which result should be
    used for display.

    Typically, if the formatter is for an x-axis, then dimension should be
    ``"lon"`` and if the formatter is for a y-axis, then the dimension
    should be `"lat"``.

    In order to prevent hard to debug errors, there is no default value for
    dimension. Using an un-configured ``MercatorTickFormatter`` will result in
    a validation error and a JavaScript console error.
    """)

    @error(MISSING_MERCATOR_DIMENSION)
    def _check_missing_dimension(self):
        if self.dimension is None:
            return str(self)

class NumeralTickFormatter(TickFormatter):
    ''' Tick formatter based on a human-readable format string. '''

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

class PrintfTickFormatter(TickFormatter):
    ''' Tick formatter based on a printf-style format string. '''

    format = String("%s", help="""
    The number format, as defined as follows: the placeholder in the format
    string is marked by % and is followed by one or more of these elements,
    in this order:

    * An optional ``+`` sign
        Causes the result to be preceded with a plus or minus sign on numeric
        values. By default, only the ``-`` sign is used on negative numbers.

    * An optional padding specifier
        Specifies what (if any) character to use for padding. Possible values
        are 0 or any other character preceded by a ``'`` (single quote). The
        default is to pad with spaces.

    * An optional ``-`` sign
        Causes sprintf to left-align the result of this placeholder. The default
        is to right-align the result.

    * An optional number
        Specifies how many characters the result should have. If the value to be
        returned is shorter than this number, the result will be padded.

    * An optional precision modifier
        Consists of a ``.`` (dot) followed by a number, specifies how many digits
        should be displayed for floating point numbers. When used on a string, it
        causes the result to be truncated.

    * A type specifier
        Can be any of:

        - ``%`` --- yields a literal ``%`` character
        - ``b`` --- yields an integer as a binary number
        - ``c`` --- yields an integer as the character with that ASCII value
        - ``d`` or ``i`` --- yields an integer as a signed decimal number
        - ``e`` --- yields a float using scientific notation
        - ``u`` --- yields an integer as an unsigned decimal number
        - ``f`` --- yields a float as is
        - ``o`` --- yields an integer as an octal number
        - ``s`` --- yields a string as is
        - ``x`` --- yields an integer as a hexadecimal number (lower-case)
        - ``X`` --- yields an integer as a hexadecimal number (upper-case)

    """)

class LogTickFormatter(TickFormatter):
    ''' Display tick values from continuous ranges as powers
    of some base.

    Most often useful in conjunction with a ``LogTicker``.

    '''
    ticker = Instance(Ticker, help="""
    The corresponding ``LogTicker``, used to determine the correct
    base to use. If unset, the formatter will use base 10 as a default.
    """)

class CategoricalTickFormatter(TickFormatter):
    ''' Display tick values from categorical ranges as string
    values.

    '''
    pass

class FuncTickFormatter(TickFormatter):
    ''' Display tick values that are formatted by a user-defined function.

    .. warning::
        The explicit purpose of this Bokeh Model is to embed *raw JavaScript
        code* for a browser to execute. If any part of the code is derived
        from untrusted user inputs, then you must take appropriate care to
        sanitize the user input prior to passing to Bokeh.

    '''

    args = Dict(String, AnyRef, help="""
    A mapping of names to Python objects. In particular those can be bokeh's models.
    These objects are made available to the formatter's code snippet as the values of
    named parameters to the callback.
    """)

    code = String(default="", help="""
    A snippet of JavaScript code that reformats a single tick to the desired
    format. The variable ``tick`` will contain the unformatted tick value and
    can be expected to be present in the code snippet namespace at render time.

    Additionally available variables are:

      * ``ticks``, an array of all axis ticks as positioned by the ticker,
      * ``index``, the position of ``tick`` within ``ticks``, and
      * the keys of ``args`` mapping, if any.

    Finding yourself needing to cache an expensive ``ticks``-dependent
    computation, you can store it on the ``this`` variable.

    Example:

        .. code-block:: javascript

            code = '''
            this.precision = this.precision || (ticks.length > 5 ? 1 : 2);
            return Math.floor(tick) + " + " + (tick % 1).toFixed(this.precision);
            '''
    """)

class DatetimeTickFormatter(TickFormatter):
    ''' A ``TickFormatter`` for displaying datetime values nicely across a
    range of scales.

    ``DatetimeTickFormatter`` has the following properties (listed together
    with their default values) that can be used to control the formatting
    of axis ticks at different scales scales:

    .. code-block:: python

        {defaults}

    Each scale property can be set to format or list of formats to use for
    formatting datetime tick values that fall in in that "time scale".
    By default, only the first format string passed for each time scale
    will be used. By default, all leading zeros are stripped away from
    the formatted labels.

    This list of supported `strftime`_ formats is reproduced below.

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

    '''
    microseconds = List(String,
                        help=_DATETIME_TICK_FORMATTER_HELP("``microseconds``"),
                        default=['%fus']).accepts(String, lambda fmt: [fmt])

    milliseconds = List(String,
                        help=_DATETIME_TICK_FORMATTER_HELP("``milliseconds``"),
                        default=['%3Nms', '%S.%3Ns']).accepts(String, lambda fmt: [fmt])

    seconds      = List(String,
                        help=_DATETIME_TICK_FORMATTER_HELP("``seconds``"),
                        default=['%Ss']).accepts(String, lambda fmt: [fmt])

    minsec       = List(String,
                        help=_DATETIME_TICK_FORMATTER_HELP("``minsec`` (for combined minutes and seconds)"),
                        default=[':%M:%S']).accepts(String, lambda fmt: [fmt])

    minutes      = List(String,
                        help=_DATETIME_TICK_FORMATTER_HELP("``minutes``"),
                        default=[':%M', '%Mm']).accepts(String, lambda fmt: [fmt])

    hourmin      = List(String,
                        help=_DATETIME_TICK_FORMATTER_HELP("``hourmin`` (for combined hours and minutes)"),
                        default=['%H:%M']).accepts(String, lambda fmt: [fmt])

    hours        = List(String,
                        help=_DATETIME_TICK_FORMATTER_HELP("``hours``"),
                        default=['%Hh', '%H:%M']).accepts(String, lambda fmt: [fmt])

    days         = List(String,
                        help=_DATETIME_TICK_FORMATTER_HELP("``days``"),
                        default=['%m/%d', '%a%d']).accepts(String, lambda fmt: [fmt])

    months       = List(String,
                        help=_DATETIME_TICK_FORMATTER_HELP("``months``"),
                        default=['%m/%Y', '%b %Y']).accepts(String, lambda fmt: [fmt])

    years        = List(String,
                        help=_DATETIME_TICK_FORMATTER_HELP("``years``"),
                        default=['%Y']).accepts(String, lambda fmt: [fmt])

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# This is to automate documentation of DatetimeTickFormatter formats and their defaults
_df = DatetimeTickFormatter()
_df_fields = ['microseconds', 'milliseconds', 'seconds', 'minsec', 'minutes', 'hourmin', 'hours', 'days', 'months', 'years']
_df_defaults = _df.properties_with_values()
_df_defaults_string = "\n\n        ".join("%s = %s" % (name, _df_defaults[name]) for name in _df_fields)

DatetimeTickFormatter.__doc__ = format_docstring(DatetimeTickFormatter.__doc__, defaults=_df_defaults_string)
del _df, _df_fields, _df_defaults, _df_defaults_string
