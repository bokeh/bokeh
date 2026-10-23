#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

# pyright: reportAttributeAccessIssue=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys

# Public constructor types live in the stubs; declarations below cover local calls.
from typing import TYPE_CHECKING, Any, cast

# Bokeh imports
from ..core.enums import (
    ContextWhich,
    LatLon,
    Location,
    NumeralLanguage,
    ResolutionType,
    RoundingFunction,
    SIPrefix,
    TimedeltaResolutionType,
)
from ..core.has_props import abstract
from ..core.property.any import AnyRef
from ..core.property.auto import Auto
from ..core.property.container import Dict, Seq
from ..core.property.either import Either
from ..core.property.enum import Enum
from ..core.property.instance import Instance, InstanceDefault
from ..core.property.nullable import Nullable
from ..core.property.numeric import Positive
from ..core.property.primitive import (
    Bool,
    Float,
    Int,
    String,
)
from ..core.property.text_like import TextLike
from ..core.validation import error
from ..core.validation.errors import (
    INCOMPATIBLE_NESTED_TICK_FORMATTERS,
    MISSING_MERCATOR_DIMENSION,
)
from ..model import Model
from ..util.strings import format_docstring
from .tickers import ScaledTicker, Ticker

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "RELATIVE_DATETIME_CONTEXT",
    "BasicTickFormatter",
    "CategoricalTickFormatter",
    "CustomJSTickFormatter",
    "DatetimeTickFormatter",
    "LogTickFormatter",
    "MercatorTickFormatter",
    "NumeralTickFormatter",
    "PrintfTickFormatter",
    "ScaledTickFormatter",
    "SITickFormatter",
    "TickFormatter",
    "TimedeltaTickFormatter",
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _DATETIME_TICK_FORMATTER_HELP(field: str) -> str:
    return f"""
    Formats for displaying datetime values in the {field} range.

    See the :class:`~bokeh.models.formatters.DatetimeTickFormatter` help for a list of all supported formats.
    """

def _TIMEDELTA_TICK_FORMATTER_HELP(field: str) -> str:
    return f"""
    Formats for displaying timedelta values in the {field} range.

    See the :class:`~bokeh.models.formatters.TimedeltaTickFormatter` help for a list of all supported formats.
    """

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class TickFormatter(Model):
    ''' A base class for all tick formatter types.

    '''

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

class ScaledTickFormatter(TickFormatter):
    r''' Format ticks with optional unit conversion and repeated decoration.

    When used with a ``ScaledTicker``, tick values are normalized with
    ``(value - origin)/scale`` before being passed to ``formatter``. With any
    other ticker, values are formatted without normalization. Optional text
    can be added before or after each formatted value. This allows symbolic
    units such as :math:`\pi` to be displayed without a
    ``CustomJSTickFormatter``.

    Math-text decorations are rendered by graphics-aware consumers such as
    axes. String-only consumers of ``TickFormatter``, including ``compute``
    and ``v_compute``, receive the decoration's source text instead. When a
    TeX decoration is present, the inner formatter's string output is safely
    embedded in one TeX expression; any richer graphics produced by the inner
    formatter are not retained in that mode.

    ``ScaledTickFormatter`` and ``SITickFormatter`` cannot be nested. They
    apply different display-coordinate transformations and composing them
    would produce ambiguous labels.

    '''

    ticker = Nullable(Instance(ScaledTicker), default=None, help="""
    An optional fallback ``ScaledTicker`` used when formatting outside an axis.

    An axis ``ScaledTicker`` takes precedence over this fallback. If neither is
    present, values are formatted without normalization. This property is
    therefore normally left unset for axis formatters.
    """)

    # The descriptor accepts subclasses at runtime, but its generic type expects the exact base class.
    formatter = Instance(TickFormatter, default=cast(Any, InstanceDefault(BasicTickFormatter)), help="""
    The formatter applied to normalized tick values.
    """)

    origin_label = TextLike(default="", help="""
    An optional label representing the zero point of the normalized values.

    Nonzero values are displayed as signed offsets from this label. For
    example, ``origin_label=TeX(text=r"\\overline{x}")`` with
    ``unit=TeX(text=r"\\sigma")`` can produce labels such as
    :math:`\\overline{x}-2\\sigma`, :math:`\\overline{x}`, and
    :math:`\\overline{x}+2\\sigma`. This affects label composition only;
    normalization remains controlled by the ticker's scale and origin. Strings
    containing recognized math-text delimiters and explicit text models are
    supported.
    """)

    prefix = TextLike(default="", help="""
    Text placed before each formatted value. Strings containing recognized
    math-text delimiters and explicit text models are supported. If any
    decoration is TeX and no decoration uses a different math-text backend,
    the complete label is rendered as one TeX expression.
    """)

    unit = TextLike(default="", help="""
    The unit or symbol displayed with each formatted value, for example
    ``"π"``, ``"°"``, or ``TeX(text=r"\\sigma")``. It follows the value by
    default; ``unit_style="symbolic"`` places it in fraction numerators and
    omits coefficients equal to one. Strings containing recognized math-text
    delimiters and explicit text models are supported. If any decoration is
    TeX and no decoration uses a different math-text backend, the complete
    label is rendered as one TeX expression.
    """)

    unit_style = Enum("always", "except_zero", "symbolic", default="always", help="""
    How ``prefix`` and ``unit`` are combined with the normalized value.

    ``"always"`` applies them to every value, including zero. In fraction
    mode they surround the complete fraction, for example ``1/2°``.
    ``"except_zero"`` behaves the same way but leaves zero undecorated.
    ``"symbolic"`` additionally omits coefficients equal to one when a
    unit is present and places that unit in the fraction numerator,
    producing labels such as ``π`` and ``3π/4``. The minus sign used for
    negative one is inherited from ``formatter``.
    """)

    use_fractions = Bool(default=False, help="""
    Whether coefficients close to a fraction should be displayed as fractions.

    The denominator is bounded by ``max_denominator``. Values that are not
    sufficiently close to such a fraction retain the output of ``formatter``.
    With ``unit_style="symbolic"``, a unit such as ``"π"`` is placed in
    the numerator, producing labels such as ``π/2`` and ``3π/4``. Otherwise,
    the prefix and unit surround the complete fraction.
    """)

    fraction_style = Enum("stacked", "inline", default="inline", help="""
    How fractions are rendered when a decoration uses TeX.

    ``"inline"`` (the default) keeps the complete label in math text but uses
    a compact solidus form such as ``\\pi/2``. ``"stacked"`` uses a TeX
    fraction such as ``\\frac{\\pi}{2}``. Plain-text labels always use the
    inline form.
    """)

    max_denominator = Positive(Int, default=16, help="""
    The largest denominator considered when ``use_fractions`` is true.
    """)

    @error(INCOMPATIBLE_NESTED_TICK_FORMATTERS)
    def _check_incompatible_nested_formatter(self) -> str | None:
        if isinstance(self.formatter, SITickFormatter):
            return "ScaledTickFormatter and SITickFormatter cannot be nested"
        return None

class SITickFormatter(TickFormatter):
    r''' Format numeric ticks using an SI unit and prefix.

    With ``prefix="auto"``, one shared engineering prefix is selected from
    the full set of ticks and the scaled values are passed to ``formatter``.
    For example, ticks spanning millions with ``unit="Hz"`` are displayed in
    MHz. A fixed prefix such as ``prefix="k"`` can be used when the scale
    should remain constant while panning or zooming.

    Set ``input_scale`` when the data is not in base units. For example,
    ``unit="Hz", input_scale=1e6`` formats axis ticks for data stored in MHz
    as if the data were supplied in Hz, without changing the data or tick
    locations.

    Plain-text SI units are separated from their numeric values by a space. TeX
    labels use a thin mathematical space instead. Strings with recognized
    math-text delimiters and explicit text models are supported for ``unit``
    by graphics-aware consumers such as axes.

    Automatic selection considers only the values passed in one formatting
    call. Axis rendering and ``v_compute`` pass a complete vector, whereas
    ``compute`` and scalar widget consumers select a prefix from one value.
    Use a fixed prefix when separately formatted values must remain directly
    comparable. String-only consumers receive the unit's source text; when a
    unit is TeX, graphics-aware consumers render the complete label as one TeX
    expression. In that mode, the inner formatter's string output is safely
    embedded in the expression; any richer graphics produced by the inner
    formatter are not retained.

    ``SITickFormatter`` and ``ScaledTickFormatter`` cannot be nested. They
    apply different display-coordinate transformations and composing them
    would produce ambiguous labels.

    '''

    # The descriptor accepts subclasses at runtime, but its generic type expects the exact base class.
    formatter = Instance(TickFormatter, default=cast(Any, InstanceDefault(BasicTickFormatter)), help="""
    The formatter applied after scaling tick values by the selected prefix.
    """)

    input_scale = Positive(Float, default=1.0, help="""
    A positive multiplier converting input values to the base unit before
    prefix selection and formatting. For example, use ``1e6`` for data stored
    in MHz with ``unit="Hz"``, or ``1e-3`` for milliseconds with ``unit="s"``.

    A value is formatted as ``value*input_scale/prefix_factor``. This conversion
    also applies with a fixed prefix or ``prefix=None``; only labels are
    affected, not the underlying data, tick locations, or hover values.
    """)

    unit = TextLike(default="", help="""
    The base SI unit appended to each formatted value, for example ``"Hz"``.
    Strings containing recognized math-text delimiters and explicit text
    models are supported.
    """)

    prefix = Nullable(Either(
        Auto,
        Enum(SIPrefix),
    ), default="auto", help="""
    The SI prefix used to scale and decorate tick values.

    ``"auto"`` selects one shared engineering prefix from the full set of
    ticks. A fixed prefix keeps the scale stable independently of the visible
    tick values, while ``None`` disables prefix scaling. Input values are
    always converted to the base unit using ``input_scale`` first.

    Use the micro sign ``"µ"`` (U+00B5) for the micro prefix. The Greek letter
    mu ``"μ"`` (U+03BC) and the ASCII approximation ``"u"`` are not accepted.
    """)

    unit_style = Enum("always", "except_zero", default="always", help="""
    Controls whether the SI prefix and unit are appended to zero.

    The default ``"always"`` decorates every label. ``"except_zero"`` leaves
    an exact numeric zero undecorated while retaining the shared prefix chosen
    from the complete tick vector.
    """)

    @error(INCOMPATIBLE_NESTED_TICK_FORMATTERS)
    def _check_incompatible_nested_formatter(self) -> str | None:
        if isinstance(self.formatter, ScaledTickFormatter):
            return "SITickFormatter and ScaledTickFormatter cannot be nested"
        return None

class MercatorTickFormatter(BasicTickFormatter):
    ''' A ``TickFormatter`` for values in WebMercator units.

    Some map plot types internally use WebMercator to describe coordinates,
    plot bounds, etc. These units are not very human-friendly. This tick
    formatter will convert WebMercator units into Latitude and Longitude
    for display on axes.

    '''

    dimension = Nullable(Enum(LatLon), help="""
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

    ticker = Nullable(Instance(Ticker), help="""
    The corresponding ``LogTicker``, used to determine the correct
    base to use. If unset, the formatter will use base 10 as a default.
    """)

    min_exponent = Int(0, help="""
    Minimum exponent to format in scientific notation. If not zero
    all ticks in range from base^-min_exponent to base^min_exponent
    are displayed without exponential notation.
    """)

class CategoricalTickFormatter(TickFormatter):
    ''' Display tick values from categorical ranges as string
    values.

    '''

class CustomJSTickFormatter(TickFormatter):
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

    **Example**

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
    of axis ticks at different scales:

    {defaults}

    Each scale property can be set to format or list of formats to use for
    formatting datetime tick values that fall in that "time scale".
    By default, only the first format string passed for each time scale
    will be used. By default, all leading zeros are stripped away from
    the formatted labels.

    This list of supported `strftime`_ formats is reproduced below.

    +----+------------------------------------------------------------------+
    | %a | The abbreviated name of the day of the week according to the     |
    |    | current locale.                                                  |
    +----+------------------------------------------------------------------+
    | %A | The full name of the day of the week according to the current    |
    |    | locale.                                                          |
    +----+------------------------------------------------------------------+
    | %b | The abbreviated month name according to the current locale.      |
    +----+------------------------------------------------------------------+
    | %B | The full month name according to the current locale.             |
    +----+------------------------------------------------------------------+
    | %c | The preferred date and time representation for the current       |
    |    | locale.                                                          |
    +----+------------------------------------------------------------------+
    | %C | The century number (year/100) as a 2-digit integer.              |
    +----+------------------------------------------------------------------+
    | %d | The day of the month as a decimal number (range 01 to 31).       |
    +----+------------------------------------------------------------------+
    | %D | Equivalent to **%m/%d/%y**. (Americans should note that in many  |
    |    | other countries **%d/%m/%y** is rather common. This means that   |
    |    | in international context this format is ambiguous and should not |
    |    | be used.)                                                        |
    +----+------------------------------------------------------------------+
    | %e | Like **%d**, the day of the month as a decimal number, but a     |
    |    | leading zero is replaced by a space.                             |
    +----+------------------------------------------------------------------+
    | %f | Microsecond as a decimal number, zero-padded on the left (range  |
    |    | 000000-999999). This is an extension to the set of directives    |
    |    | available to `timezone`_.                                        |
    +----+------------------------------------------------------------------+
    | %F | Equivalent to **%Y-%m-%d** (the ISO 8601 date format).           |
    +----+------------------------------------------------------------------+
    | %G | The ISO 8601 week-based year with century as a decimal number.   |
    |    | The 4-digit year corresponding to the ISO week number (see       |
    |    | **%V**). This has the same format and value as **%Y**, except    |
    |    | that if the ISO week number belongs to the previous or next      |
    |    | year, that year is used instead.                                 |
    +----+------------------------------------------------------------------+
    | %g | Like **%G**, but without century, that is, with a 2-digit year   |
    |    | (00-99).                                                         |
    +----+------------------------------------------------------------------+
    | %h | Equivalent to **%b**.                                            |
    +----+------------------------------------------------------------------+
    | %H | The hour as a decimal number using a 24-hour clock (range 00 to  |
    |    | 23).                                                             |
    +----+------------------------------------------------------------------+
    | %I | The hour as a decimal number using a 12-hour clock (range 01 to  |
    |    | 12).                                                             |
    +----+------------------------------------------------------------------+
    | %j | The day of the year as a decimal number (range 001 to 366).      |
    +----+------------------------------------------------------------------+
    | %k | The hour (24-hour clock) as a decimal number (range 0 to 23).    |
    |    | Single digits are preceded by a blank. See also **%H**.          |
    +----+------------------------------------------------------------------+
    | %l | The hour (12-hour clock) as a decimal number (range 1 to 12).    |
    |    | Single digits are preceded by a blank. See also **%I**.          |
    +----+------------------------------------------------------------------+
    | %m | The month as a decimal number (range 01 to 12).                  |
    +----+------------------------------------------------------------------+
    | %M | The minute as a decimal number (range 00 to 59).                 |
    +----+------------------------------------------------------------------+
    | %n | A newline character. Bokeh text does not currently support       |
    |    | newline characters.                                              |
    +----+------------------------------------------------------------------+
    | %N | Nanosecond as a decimal number, zero-padded on the left (range   |
    |    | 000000000-999999999). Supports a padding width specifier, i.e.   |
    |    | **%3N** displays 3 leftmost digits. However, this is only        |
    |    | accurate to the millisecond level of precision due to            |
    |    | limitations of `timezone`_.                                      |
    +----+------------------------------------------------------------------+
    | %p | Either "AM" or "PM" according to the given time value, or the    |
    |    | corresponding strings for the current locale.  Noon is treated   |
    |    | as "PM" and midnight as "AM".                                    |
    +----+------------------------------------------------------------------+
    | %P | Like **%p** but in lowercase: "am" or "pm" or a corresponding    |
    |    | string for the current locale.                                   |
    +----+------------------------------------------------------------------+
    | %r | The time in a.m. or p.m. notation. In the POSIX locale this is   |
    |    | equivalent to **%I:%M:%S %p**.                                   |
    +----+------------------------------------------------------------------+
    | %R | The time in 24-hour notation (**%H:%M**). For a version          |
    |    | including the seconds, see **%T** below.                         |
    +----+------------------------------------------------------------------+
    | %s | The number of seconds since the Epoch, 1970-01-01 00:00:00+0000  |
    |    | (UTC).                                                           |
    +----+------------------------------------------------------------------+
    | %S | The second as a decimal number (range 00 to 60).  (The range is  |
    |    | up to 60 to allow for occasional leap seconds.)                  |
    +----+------------------------------------------------------------------+
    | %t | A tab character. Bokeh text does not currently support tab       |
    |    | characters.                                                      |
    +----+------------------------------------------------------------------+
    | %T | The time in 24-hour notation (**%H:%M:%S**).                     |
    +----+------------------------------------------------------------------+
    | %u | The day of the week as a decimal, range 1 to 7, Monday being 1.  |
    |    | See also **%w**.                                                 |
    +----+------------------------------------------------------------------+
    | %U | The week number of the current year as a decimal number, range   |
    |    | 00 to 53, starting with the first Sunday as the first day of     |
    |    | week 01.  See also **%V** and **%W**.                            |
    +----+------------------------------------------------------------------+
    | %V | The ISO 8601 week number (see NOTES) of the current year as a    |
    |    | decimal number, range 01 to 53, where week 1 is the first week   |
    |    | that has at least 4 days in the new year. See also **%U** and    |
    |    | **%W.**                                                          |
    +----+------------------------------------------------------------------+
    | %w | The day of the week as a decimal, range 0 to 6, Sunday being 0.  |
    |    | See also **%u**.                                                 |
    +----+------------------------------------------------------------------+
    | %W | The week number of the current year as a decimal number, range   |
    |    | 00 to 53, starting with the first Monday as the first day of     |
    |    | week 01.                                                         |
    +----+------------------------------------------------------------------+
    | %x | The preferred date representation for the current locale without |
    |    | the time.                                                        |
    +----+------------------------------------------------------------------+
    | %X | The preferred time representation for the current locale without |
    |    | the date.                                                        |
    +----+------------------------------------------------------------------+
    | %y | The year as a decimal number without a century (range 00 to 99). |
    +----+------------------------------------------------------------------+
    | %Y | The year as a decimal number including the century.              |
    +----+------------------------------------------------------------------+
    | %z | The +hhmm or -hhmm numeric timezone (that is, the hour and       |
    |    | minute offset from UTC).                                         |
    +----+------------------------------------------------------------------+
    | %Z | The timezone name or abbreviation.                               |
    +----+------------------------------------------------------------------+
    | %% | A literal '%' character.                                         |
    +----+------------------------------------------------------------------+

    .. warning::
        The client library BokehJS uses the `timezone`_ library to
        format datetimes. The inclusion of the list below is based on the
        claim that `timezone`_ makes to support "the full complement
        of GNU date format specifiers." However, this claim has not
        been tested exhaustively against this list. If you find formats
        that do not function as expected, please submit a `GitHub issue`_,
        so that the documentation can be updated appropriately.

    .. _strftime: http://man7.org/linux/man-pages/man3/strftime.3.html
    .. _timezone: http://bigeasy.github.io/timezone/
    .. _github issue: https://github.com/bokeh/bokeh/issues

    '''

    if TYPE_CHECKING:
        def __init__(self, *args: Any, **kwargs: Any) -> None: ...

    microseconds = String(help=_DATETIME_TICK_FORMATTER_HELP("``microseconds``"),
                          default="%fus")

    milliseconds = String(help=_DATETIME_TICK_FORMATTER_HELP("``milliseconds``"),
                          default="%3Nms")

    seconds = String(help=_DATETIME_TICK_FORMATTER_HELP("``seconds``"),
                     default="%Ss")

    minsec = String(help=_DATETIME_TICK_FORMATTER_HELP("``minsec`` (for combined minutes and seconds)"),
                    default=":%M:%S")

    minutes = String(help=_DATETIME_TICK_FORMATTER_HELP("``minutes``"),
                     default=":%M")

    hourmin = String(help=_DATETIME_TICK_FORMATTER_HELP("``hourmin`` (for combined hours and minutes)"),
                     default="%H:%M")

    hours = String(help=_DATETIME_TICK_FORMATTER_HELP("``hours``"),
                   default="%Hh")

    days = String(help=_DATETIME_TICK_FORMATTER_HELP("``days``"),
                  default="%m/%d")

    months = String(help=_DATETIME_TICK_FORMATTER_HELP("``months``"),
                    default="%m/%Y")

    years = String(help=_DATETIME_TICK_FORMATTER_HELP("``years``"),
                   default="%Y")

    strip_leading_zeros = Either(Bool, Seq(Enum(ResolutionType)), default=False, help="""
    Whether to strip any leading zeros in the formatted ticks.

    Valid values are:

    * ``True`` or ``False`` (default) to set stripping across all resolutions.
    * A sequence of resolution types, e.g. ``["microseconds", "milliseconds"]``, to enable
      scale-dependent stripping of leading zeros.
    """)

    boundary_scaling = Bool(default=True, help="""
    Whether to scale up ticks that are right at the boundary of the next higher resolution of time.
    E.g. at the hours scale a tick sequence of ["00h", "06h", "12h", 18h", "00h"] will see a scale up of the "00h" ticks
    as they are on boundary of the days scale: ["06/08", "06h", "12h", 18h", "06/09"]
    """)

    hide_repeats = Bool(default=False, help="""
    Whether repeated formatted tick values will be suppressed.

    For example, an initial set of ticks ``["06/07", "06/07", "06/07", "06/08",
    "06/08"]`` will become ``["06/07", "", "", "06/08", ""]``. Only the base
    label, without any additional context, is considered when determining
    repeats. If the context itself is a ``DatetimeTickFormatter``, then this
    property may also be set for the context separately, if desired.
    """)

    context = Nullable(Either(String, Instance("bokeh.models.formatters.DatetimeTickFormatter")), default=None, help="""
    A format for adding context to the tick or ticks specified by ``context_which``.
    Valid values are:

    * None, no context is added
    * A standard :class:`~bokeh.models.DatetimeTickFormatter` format string, the single format is
      used across all scales
    * Another :class:`~bokeh.models.DatetimeTickFormatter` instance, to have scale-dependent
      context
    """)

    context_which = Enum(ContextWhich, default="start", help="""
    Which tick or ticks to add a formatted context string to. Valid values are:
    `"start"`, `"end"`, `"center"`, and  `"all"`.
    """)

    context_location = Enum(Location, default="below", help="""
    Relative to the tick label text baseline, where the context should be
    rendered. Valid values are: `"below"`, `"above"`, `"left"`, and `"right"`.
    """)


class TimedeltaTickFormatter(TickFormatter):
    ''' A ``TickFormatter`` for displaying timedelta values nicely across a
    range of scales. The largest scale for differentiating between formats
    is "days", as the conversion from "days" to "months" or "years" is not
    well defined.

    ``TimedeltaTickFormatter`` has the following properties (listed together
    with their default values) that can be used to control the formatting
    of axis ticks at different scales:

    {defaults}

    Each scale property can be set to format or list of formats to use for
    formatting timedelta tick values that fall in that "time scale".
    By default, only the first format string passed for each time scale
    will be used. By default, leading zeros are stripped away from
    the formatted labels for the time scales ``nanoseconds``, ``microseconds``
    and ``milliseconds``.

    This list of supported formats is reproduced below. In general formats
    with an uppercase letter refer to the time passed since the next last
    larger time format (e.g. minutes since the last hour). On the other hand
    formats with a lowercase letter corresponds to the overall completed time
    passed (3.6 days becomes 3 days).

    +--------+-----------------------------------------------------------------+
    | %NS    | Nanoseconds since last microsecond as a decimal number,         |
    |        | zero-padded on the left (range 000 to 999).                     |
    |        | Warning: Due to floating point precision, ticks may be formatted|
    |        | incorrectly if the overall timedelta is rather large (>10days). |
    +--------+-----------------------------------------------------------------+
    | %ns    | Overall completed nanoseconds.                                  |
    |        | Warning: Due to floating point precision, ticks may be formatted|
    |        | incorrectly if the overall timedelta is rather large (>10days). |
    +--------+-----------------------------------------------------------------+
    | %US    | Microseconds since last millisecond as a decimal number,        |
    |        | zero-padded on the left (range 000 to 999).                     |
    +--------+-----------------------------------------------------------------+
    | %us    | Overall completed microseconds.                                 |
    +--------+-----------------------------------------------------------------+
    | %MS    | Milliseconds since last second as a decimal number,             |
    |        | zero-padded on the left (range 000 to 999).                     |
    +--------+-----------------------------------------------------------------+
    | %ms    | Overall completed milliseconds.                                 |
    +--------+-----------------------------------------------------------------+
    | %S     | Seconds since last minute as a decimal number, zero-padded on   |
    |        | the left (range 00 to 59).                                      |
    +--------+-----------------------------------------------------------------+
    | %s     | Overall completed seconds.                                      |
    +--------+-----------------------------------------------------------------+
    | %M     | Minutes since last hour as a decimal number, zero-padded on     |
    |        | the left (range 00 to 59).                                      |
    +--------+-----------------------------------------------------------------+
    | %m     | Overall completed minutes.                                      |
    +--------+-----------------------------------------------------------------+
    | %H     | Hours since last day as a decimal number, zero-padded on the    |
    |        | left (range 00 to 23).                                          |
    +--------+-----------------------------------------------------------------+
    | %h     | Overall completed hours.                                        |
    +--------+-----------------------------------------------------------------+
    | %d     | Overall completed days.                                         |
    +--------+-----------------------------------------------------------------+

    '''

    if TYPE_CHECKING:
        def __init__(self, *args: Any, **kwargs: Any) -> None: ...

    nanoseconds = String(help=_TIMEDELTA_TICK_FORMATTER_HELP("``nanoseconds``"),
                          default="%NSns")

    microseconds = String(help=_TIMEDELTA_TICK_FORMATTER_HELP("``microseconds``"),
                          default="%USus")

    milliseconds = String(help=_TIMEDELTA_TICK_FORMATTER_HELP("``milliseconds``"),
                          default="%MSms")

    seconds = String(help=_TIMEDELTA_TICK_FORMATTER_HELP("``seconds``"),
                     default="%H:%M:%S")

    minsec = String(help=_TIMEDELTA_TICK_FORMATTER_HELP("``minsec`` (for combined minutes and seconds)"),
                    default="%H:%M:%S")

    minutes = String(help=_TIMEDELTA_TICK_FORMATTER_HELP("``minutes``"),
                     default="%H:%M")

    hourmin = String(help=_TIMEDELTA_TICK_FORMATTER_HELP("``hourmin`` (for combined hours and minutes)"),
                     default="%H:%M")

    hours = String(help=_TIMEDELTA_TICK_FORMATTER_HELP("``hours``"),
                   default="%H:%M")

    days = String(help=_TIMEDELTA_TICK_FORMATTER_HELP("``days``"),
                  default="%d days")

    strip_leading_zeros = Either(Bool, Seq(Enum(TimedeltaResolutionType)), default=False, help="""
    Whether to strip any leading zeros in the formatted ticks.

    Valid values are:

    * ``True`` or ``False`` (default) to set stripping across all resolutions.
    * A sequence of resolution types, e.g. ``["microseconds", "milliseconds"]``, to enable
      scale-dependent stripping of leading zeros.
    """)

    hide_repeats = Bool(default=False, help="""
    Whether repeated formatted tick values will be suppressed.

    For example, an initial set of ticks ``["06:07", "06:07", "06:07", "06:08",
    "06:08"]`` will become ``["06:07", "", "", "06:08", ""]``. Only the base
    label, without any additional context, is considered when determining
    repeats. If the context itself is a ``TimedeltaTickFormatter``, then this
    property may also be set for the context separately, if desired.
    """)

    context = Nullable(Either(String, Instance("bokeh.models.formatters.TimedeltaTickFormatter")), default=None, help="""
    A format for adding context to the tick or ticks specified by ``context_which``.
    Valid values are:

    * None, no context is added
    * A standard :class:`~bokeh.models.TimedeltaTickFormatter` format string, the single format is
      used across all scales
    * Another :class:`~bokeh.models.TimedeltaTickFormatter` instance, to have scale-dependent
      context
    """)

    context_which = Enum(ContextWhich, default="start", help="""
    Which tick or ticks to add a formatted context string to. Valid values are:
    `"start"`, `"end"`, `"center"`, and  `"all"`.
    """)

    context_location = Enum(Location, default="below", help="""
    Relative to the tick label text baseline, where the context should be
    rendered. Valid values are: `"below"`, `"above"`, `"left"`, and `"right"`.
    """)


def RELATIVE_DATETIME_CONTEXT() -> DatetimeTickFormatter:
    return DatetimeTickFormatter(
        microseconds="%T",
        milliseconds="%T",
        seconds="%H:%M",
        minsec="%Hh",
        minutes="%Hh",
        hourmin="%F",
        hours="%F",
        days="%Y",
        months="",
        years="",
    )


def CONTEXTUAL_DATETIME_FORMATTER() -> DatetimeTickFormatter:
    return DatetimeTickFormatter(
        microseconds="%fus",
        milliseconds="%3Nms",
        seconds="%T",
        minsec="%T",
        minutes="%H:%M",
        hourmin="%H:%M",
        hours="%H:%M",
        days="%b %d",
        months="%b %Y",
        years="%Y",
        strip_leading_zeros=["microseconds", "milliseconds", "seconds"],
        boundary_scaling=False,
        context_which="all",
        context=DatetimeTickFormatter(
            microseconds="%T",
            milliseconds="%T",
            seconds="%b %d, %Y",
            minsec="%b %d, %Y",
            minutes="%b %d, %Y",
            hourmin="%b %d, %Y",
            hours="%b %d, %Y",
            days="%Y",
            months="",
            years="",
            boundary_scaling=False,
            hide_repeats=True,
            context_which="all",
            context=DatetimeTickFormatter(
                microseconds="%b %d, %Y",
                milliseconds="%b %d, %Y",
                seconds="",
                minsec="",
                minutes="",
                hourmin="",
                hours="",
                days="",
                months="",
                years="",
                boundary_scaling=False,
                hide_repeats=True,
                context=None,
            ),
        ),
    )

def CONTEXTUAL_TIMEDELTA_FORMATTER() -> TimedeltaTickFormatter:
    return TimedeltaTickFormatter(
        nanoseconds="%NSns",
        microseconds="%USus",
        milliseconds="%MSms",
        seconds="%H:%M:%S",
        minsec="%H:%M:%S",
        minutes="%H:%M",
        hourmin="%H:%M",
        hours="%H:%M",
        days="%d days",
        strip_leading_zeros=["nanoseconds", "microseconds", "milliseconds"],
        context_which="all",
        context=TimedeltaTickFormatter(
            nanoseconds="%H:%M:%S.%MS%US",
            microseconds="%H:%M:%S.%MS",
            milliseconds="%H:%M:%S",
            seconds="%d days",
            minsec="%d days",
            minutes="%d days",
            hourmin="%d days",
            hours="%d days",
            days="",
            hide_repeats=True,
            context_which="all",
            context=TimedeltaTickFormatter(
                nanoseconds="%d days",
                microseconds="%d days",
                milliseconds="%d days",
                seconds="",
                minsec="",
                minutes="",
                hourmin="",
                hours="",
                days="",
                hide_repeats=True,
                context=None,
            ),
        ),
    )
#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# This is to automate documentation of DatetimeTickFormatter/TimedeltaTickFormatter formats and their defaults.


def create_format_table(fields: tuple[str, ...], primary: TickFormatter) -> str:

    def extended_join(character, iterable):
        return f"{character}{character.join(iterable)}{character}"

    def add_row_item(obj, name, string_length):
        value = getattr(obj, name) if obj else ""
        return f"{value:<{string_length}}"

    def create_separator_line(character):
        return extended_join("+", [character*col_len for col_len in lens])
    column_names = ["Scale", "Format", "1st Context", "2nd Context"]
    # Get formatters for each context level
    secondary = primary.context
    tertiary = secondary.context

    lens = [len(name) for name in column_names]
    lens[0] = max(lens[0], max(map(len, fields)))
    lens[1] = max(lens[1], max(map(lambda f: len(getattr(primary, f) if primary else ""), fields)))
    lens[2] = max(lens[2], max(map(lambda f: len(getattr(secondary, f) if primary else ""), fields)))
    lens[3] = max(lens[3], max(map(lambda f: len(getattr(tertiary, f) if primary else ""), fields)))
    separator = create_separator_line("-")
    rows = [
        separator,
        extended_join("|", [f"{value:<{n}}" for value, n in zip(column_names, lens)]),
        create_separator_line("="),
    ]

    # Build table rows
    for field in fields:
        scale = f"{field:<{lens[0]}}"
        p_fmt = add_row_item(primary, field, lens[1])
        c1_fmt = add_row_item(secondary, field, lens[2])
        c2_fmt = add_row_item(tertiary, field, lens[3])
        rows.append(extended_join("|", [scale, p_fmt, c1_fmt, c2_fmt]))
        rows.append(separator)
    n = 0 if sys.version_info[:2] >= (3, 13) else 4 # remove when Python 3.12 is dropped
    indent = " "*n
    return f"\n{indent}".join(rows)


DatetimeTickFormatter.__doc__ = format_docstring(DatetimeTickFormatter.__doc__, defaults=create_format_table(
    ('microseconds', 'milliseconds', 'seconds', 'minsec', 'minutes', 'hourmin', 'hours', 'days', 'months', 'years'),
    CONTEXTUAL_DATETIME_FORMATTER(),
))

TimedeltaTickFormatter.__doc__ = format_docstring(TimedeltaTickFormatter.__doc__, defaults=create_format_table(
    ('nanoseconds', 'microseconds', 'milliseconds', 'seconds', 'minsec', 'minutes', 'hourmin', 'hours', 'days'),
    CONTEXTUAL_TIMEDELTA_FORMATTER(),
))
