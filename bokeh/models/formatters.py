""" Models for controlling the text and visual formatting of tick
labels on Bokeh plot axes.

"""
from __future__ import absolute_import

from .tickers import Ticker
from ..plot_object import PlotObject
from ..properties import Bool, Int, String, Enum, Auto, List, Dict, Either, Instance
from ..enums import DatetimeUnits

class TickFormatter(PlotObject):
    """ A base class for all tick formatter types. ``TickFormatter`` is
    not generally useful to instantiate on its own.

    """
    pass

class BasicTickFormatter(TickFormatter):
    """ Display tick values from continuous ranges as "basic numbers",
    using scientific notation when appropriate by default.

    """
    precision = Either(Auto, Int, help="""
    How many digits of precision to display.
    """)

    use_scientific = Bool(True, help="""
    Whether to ever display scientific notation. If ``True`, t when to
    use scientific notation is controlled by ``power_limit_low`` and
    ``power_limit_high``.
    """)

    power_limit_high = Int(5, help="""
    Display tick values in scientific notation when::

        log(x) >= power_limit_high
    """)

    power_limit_low = Int(-3, help="""
    Display tick values in scientific notation when::

        log(x) <= power_limit_low
    """)

class LogTickFormatter(TickFormatter):
    """ Display tick values from continuous ranges as powers
    of some base.

    Most often useful in conjunction with a ``LogTicker``.

    """
    ticker = Instance(Ticker, help="""
    Configure with a corresponding ``LogTicker`` to support bases
    other than the default base 10.
    """)

class CategoricalTickFormatter(TickFormatter):
    """ Display tick values from categorical ranges as string
    values.

    """
    pass

class DatetimeTickFormatter(TickFormatter):
    """ Display tick values from a continuous range as formatted
    datetimes.

    """
    formats = Dict(Enum(DatetimeUnits), List(String), help="""
    Supply specific formats for displaying datetime values.

    The enum values correspond roughly to different "time scales". The
    corresponding value is a list of `strftime`_ formats to use for
    formatting datetime values that fall in in that "time scale".

    This list of supported `strftime`_ formats is reproduced below.

    .. warning::
        The client library BokehJS uses the `timezone`_ library to
        format datetimes. The inclusion of the list below is based on the
        claim that `timezone`_ makes to support "the full compliment
        of GNU date format specifiers." However, this claim has not
        been tested exhaustively against this list. If you find formats
        that do not function as expected, please submit a `github issue`,
        so that the documentation can be updated appropriately.

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
        A newline character.

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
        A tab character.

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

    .. _strftime: http://man7.org/linux/man-pages/man3/strftime.3.html
    .. _timezone: http://bigeasy.github.io/timezone/
    .. _github issue: https://github.com/bokeh/bokeh/issues

    """)

