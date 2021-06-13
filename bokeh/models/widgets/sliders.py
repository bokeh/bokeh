#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of slider widgets.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import numbers
import typing as tp
from datetime import date, datetime

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import (
    Bool,
    Color,
    Datetime,
    Either,
    Enum,
    Float,
    Instance,
    Int,
    NonNullable,
    Nullable,
    Override,
    Readonly,
    String,
    Tuple,
)
from ...core.validation import error
from ...core.validation.errors import EQUAL_SLIDER_START_END
from ..formatters import TickFormatter
from .widget import Widget

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AbstractSlider',
    'Slider',
    'RangeSlider',
    'DateSlider',
    'DateRangeSlider',
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class AbstractSlider(Widget):
    """ """

    def __init__(self, **kwargs) -> None:
        if 'start' in kwargs and 'end' in kwargs:
            if kwargs['start'] == kwargs['end']:
                raise ValueError("Slider 'start' and 'end' cannot be equal.")

        if "value" in kwargs and "value_throttled" not in kwargs:
            kwargs["value_throttled"] = kwargs["value"]

        super().__init__(**kwargs)

    title = Nullable(String, default="", help="""
    Slider's label.
    """)

    show_value = Bool(default=True, help="""
    Whether or not show slider's value.
    """)

    format = Either(String, Instance(TickFormatter), help="""
    """)

    direction = Enum("ltr", "rtl", help="""
    """)

    tooltips = Bool(default=True, help="""
    """)

    bar_color = Color(default="#e6e6e6", help="""
    """)

    @error(EQUAL_SLIDER_START_END)
    def _check_missing_dimension(self):
        if hasattr(self, 'start') and hasattr(self, 'end'):
            if self.start == self.end:
                return f"{self!s} with title {self.title!s}"

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Slider(AbstractSlider):
    """ Slider-based number selection widget. """

    start = NonNullable(Float, help="""
    The minimum allowable value.
    """)

    end = NonNullable(Float, help="""
    The maximum allowable value.
    """)

    value = NonNullable(Float, help="""
    Initial or selected value.
    """)

    value_throttled = Readonly(NonNullable(Float), help="""
    Initial or selected value, throttled according to report only on mouseup.
    """)

    step = Float(default=1, help="""
    The step between consecutive values.
    """)

    format = Override(default="0[.]00")

class RangeSlider(AbstractSlider):
    """ Range-slider based number range selection widget. """

    value = NonNullable(Tuple(Float, Float), help="""
    Initial or selected range.
    """)

    value_throttled = Readonly(NonNullable(Tuple(Float, Float)), help="""
    Initial or selected value, throttled according to report only on mouseup.
    """)

    start = NonNullable(Float, help="""
    The minimum allowable value.
    """)

    end = NonNullable(Float, help="""
    The maximum allowable value.
    """)

    step = Float(default=1, help="""
    The step between consecutive values.
    """)

    format = Override(default="0[.]00")

class DateSlider(AbstractSlider):
    """ Slider-based date selection widget. """

    @property
    def value_as_datetime(self) -> datetime | None:
        ''' Convenience property to retrieve the value as a datetime object.

        Added in version 2.0
        '''
        if self.value is None:
            return None

        if isinstance(self.value, numbers.Number):
            return datetime.utcfromtimestamp(self.value / 1000)

        return self.value

    @property
    def value_as_date(self) -> date | None:
        ''' Convenience property to retrieve the value as a date object.

        Added in version 2.0
        '''
        if self.value is None:
            return None

        if isinstance(self.value, numbers.Number):
            dt = datetime.utcfromtimestamp(self.value / 1000)
            return date(*dt.timetuple()[:3])

        return self.value

    value = NonNullable(Datetime, help="""
    Initial or selected value.
    """)

    value_throttled = Readonly(NonNullable(Datetime), help="""
    Initial or selected value, throttled to report only on mouseup.
    """)

    start = NonNullable(Datetime, help="""
    The minimum allowable value.
    """)

    end = NonNullable(Datetime, help="""
    The maximum allowable value.
    """)

    step = Int(default=1, help="""
    The step between consecutive values.
    """)

    format = Override(default="%d %b %Y")

class DateRangeSlider(AbstractSlider):
    """ Slider-based date range selection widget. """

    @property
    def value_as_datetime(self) -> tp.Tuple[datetime, datetime] | None:
        ''' Convenience property to retrieve the value tuple as a tuple of
        datetime objects.

        Added in version 1.1
        '''
        if self.value is None:
            return None
        v1, v2 = self.value
        if isinstance(v1, numbers.Number):
            d1 = datetime.utcfromtimestamp(v1 / 1000)
        else:
            d1 = v1
        if isinstance(v2, numbers.Number):
            d2 = datetime.utcfromtimestamp(v2 / 1000)
        else:
            d2 = v2
        return d1, d2

    @property
    def value_as_date(self) -> tp.Tuple[date, date] | None:
        ''' Convenience property to retrieve the value tuple as a tuple of
        date objects.

        Added in version 1.1
        '''
        if self.value is None:
            return None
        v1, v2 = self.value
        if isinstance(v1, numbers.Number):
            dt = datetime.utcfromtimestamp(v1 / 1000)
            d1 = date(*dt.timetuple()[:3])
        else:
            d1 = v1
        if isinstance(v2, numbers.Number):
            dt = datetime.utcfromtimestamp(v2 / 1000)
            d2 = date(*dt.timetuple()[:3])
        else:
            d2 = v2
        return d1, d2

    value = NonNullable(Tuple(Datetime, Datetime), help="""
    Initial or selected range.
    """)

    value_throttled = Readonly(NonNullable(Tuple(Datetime, Datetime)), help="""
    Initial or selected value, throttled to report only on mouseup.
    """)

    start = NonNullable(Datetime, help="""
    The minimum allowable value.
    """)

    end = NonNullable(Datetime, help="""
    The maximum allowable value.
    """)

    step = Int(default=1, help="""
    The step between consecutive values.
    """)

    format = Override(default="%d %b %Y")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
