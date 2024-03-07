#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various kinds of date, time and date/time picker widgets.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...core.enums import CalendarPosition
from ...core.has_props import HasProps, abstract
from ...core.properties import (
    Bool,
    Date,
    Datetime,
    Either,
    Enum,
    Int,
    List,
    Nullable,
    Override,
    Positive,
    String,
    Time,
    Tuple,
)
from .inputs import InputWidget

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "DatePicker",
    "DateRangePicker",
    "DatetimePicker",
    "DatetimeRangePicker",
    "MultipleDatePicker",
    "MultipleDatetimePicker",
    "TimePicker",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class PickerBase(InputWidget):
    """ Base class for various kinds of picker widgets. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    position = Enum(CalendarPosition, default="auto", help="""
    Where the calendar is rendered relative to the input when ``inline`` is False.
    """)

    inline = Bool(default=False, help="""
    Whether the calendar sholud be displayed inline.
    """)

@abstract
class TimeCommon(HasProps):
    """ Common properties for time-like picker widgets. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    hour_increment = Positive(Int)(default=1, help="""
    Defines the granularity of hour value incremements in the UI.
    """)

    minute_increment = Positive(Int)(default=1, help="""
    Defines the granularity of minute value incremements in the UI.
    """)

    second_increment = Positive(Int)(default=1, help="""
    Defines the granularity of second value incremements in the UI.
    """)

    seconds = Bool(default=False, help="""
    Allows to select seconds. By default only hours and minuts are
    selectable, and AM/PM depending on ``clock`` option.
    """)

    clock = Enum("12h", "24h", default="24h", help="""
    Whether to use 12 hour or 24 hour clock.
    """)

class TimePicker(PickerBase, TimeCommon):
    """ Widget for picking time. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = Nullable(Time, default=None, help="""
    The initial or picked time.
    """)

    time_format = String(default="H:i", help="""
    Formatting specification for the display of the picked date.

    +---+------------------------------------+------------+
    | H | Hours (24 hours)                   | 00 to 23   |
    | h | Hours                              | 1 to 12    |
    | G | Hours, 2 digits with leading zeros | 1 to 12    |
    | i | Minutes                            | 00 to 59   |
    | S | Seconds, 2 digits                  | 00 to 59   |
    | s | Seconds                            | 0, 1 to 59 |
    | K | AM/PM                              | AM or PM   |
    +---+------------------------------------+------------+

    See also https://flatpickr.js.org/formatting/#date-formatting-tokens.
    """)

    min_time = Nullable(Time)(default=None, help="""
    Optional earliest allowable time.
    """)

    max_time = Nullable(Time)(default=None, help="""
    Optional latest allowable time.
    """)

@abstract
class DateCommon(HasProps):
    """ Common properties for date-like picker widgets. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    disabled_dates = Nullable(List(Either(Date, Tuple(Date, Date))), default=None, help="""
    A list of dates of ``(start, end)`` date ranges to make unavailable for
    selection. All other dates will be avalable.

    .. note::
        Only one of ``disabled_dates`` and ``enabled_dates`` should be specified.
    """)

    enabled_dates = Nullable(List(Either(Date, Tuple(Date, Date))), default=None, help="""
    A list of dates of ``(start, end)`` date ranges to make available for
    selection. All other dates will be unavailable.

    .. note::
        Only one of ``disabled_dates`` and ``enabled_dates`` should be specified.
    """)

    date_format = String(default="Y-m-d", help="""
    Formatting specification for the display of the picked date.

    +---+-----------------------------------------------------------+-----------------------------------------+
    | d | Day of the month, 2 digits with leading zeros             | 01 to 31                                |
    | D | A textual representation of a day                         | Mon through Sun                         |
    | l | A full textual representation of the day of the week      | Sunday through Saturday                 |
    | j | Day of the month without leading zeros                    | 1 to 31                                 |
    | J | Day of the month without leading zeros and ordinal suffix | 1st, 2nd, to 31st                       |
    | w | Numeric representation of the day of the week             | 0 (for Sunday) through 6 (for Saturday) |
    | W | Numeric representation of the week                        | 0 through 52                            |
    | F | A full textual representation of a month                  | January through December                |
    | m | Numeric representation of a month, with leading zero      | 01 through 12                           |
    | n | Numeric representation of a month, without leading zeros  | 1 through 12                            |
    | M | A short textual representation of a month                 | Jan through Dec                         |
    | U | The number of seconds since the Unix Epoch                | 1413704993                              |
    | y | A two digit representation of a year                      | 99 or 03                                |
    | Y | A full numeric representation of a year, 4 digits         | 1999 or 2003                            |
    | Z | ISO Date format                                           | 2017-03-04T01:23:43.000Z                |
    +---+-----------------------------------------------------------+-----------------------------------------+

    See also https://flatpickr.js.org/formatting/#date-formatting-tokens.
    """)

@abstract
class BaseDatePicker(PickerBase, DateCommon):
    """ Bases for various calendar-based date picker widgets.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    min_date = Nullable(Date, default=None, help="""
    Optional earliest allowable date.
    """)

    max_date = Nullable(Date, default=None, help="""
    Optional latest allowable date.
    """)

class DatePicker(BaseDatePicker):
    """ Calendar-based date picker widget.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = Nullable(Date, default=None, help="""
    The initial or picked date.
    """)

class DateRangePicker(BaseDatePicker):
    """ Calendar-based picker of date ranges. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = Nullable(Tuple(Date, Date), default=None, help="""
    The initial or picked date range.
    """)

class MultipleDatePicker(BaseDatePicker):
    """ Calendar-based picker of dates. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = List(Date, default=[], help="""
    The initial or picked dates.
    """)

    separator = String(default=", ", help="""
    The separator between displayed dates.
    """)

@abstract
class BaseDatetimePicker(PickerBase, DateCommon, TimeCommon):
    """ Bases for various calendar-based datetime picker widgets.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    min_date = Nullable(Either(Datetime, Date), default=None, help="""
    Optional earliest allowable date and time.
    """)

    max_date = Nullable(Either(Datetime, Date), default=None, help="""
    Optional latest allowable date and time.
    """)

    date_format = Override(default="Y-m-d H:i")

class DatetimePicker(BaseDatetimePicker):
    """ Calendar-based date and time picker widget.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = Nullable(Datetime, default=None, help="""
    The initial or picked date and time.
    """)

class DatetimeRangePicker(BaseDatetimePicker):
    """ Calendar-based picker of date and time ranges. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = Nullable(Tuple(Datetime, Datetime), default=None, help="""
    The initial or picked date and time range.
    """)

class MultipleDatetimePicker(BaseDatetimePicker):
    """ Calendar-based picker of dates and times. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = List(Datetime, default=[], help="""
    The initial or picked dates and times.
    """)

    separator = String(default=", ", help="""
    The separator between displayed dates and times.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
