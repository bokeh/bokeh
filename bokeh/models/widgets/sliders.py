#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of slider widgets.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from datetime import datetime, date
import numbers

# External imports

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import Bool, Int, Float, String, Date, Enum, Tuple, Instance, Color, Override
from ...core.enums import SliderCallbackPolicy
from ...core.validation import error
from ...core.validation.errors import EQUAL_SLIDER_START_END
from ..callbacks import Callback
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

    def __init__(self, **kwargs):
        if 'start' in kwargs and 'end' in kwargs:
            if kwargs['start'] == kwargs['end']:
                raise ValueError("Slider 'start' and 'end' cannot be equal.")
        super(Widget, self).__init__(**kwargs)

    title = String(default="", help="""
    Slider's label.
    """)

    show_value = Bool(default=True, help="""
    Whether or not show slider's value.
    """)

    format = String(help="""
    """)

    direction = Enum("ltr", "rtl", help="""
    """)

    tooltips = Bool(default=True, help="""
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the current Slider value changes.

    DEPRECATED: use .js_on_change or .on_change with "value" or "value_throttled"
    """)

    callback_throttle = Float(default=200, help="""
    Number of milliseconds to pause between callback calls as the slider is moved.
    """)

    callback_policy = Enum(SliderCallbackPolicy, default="throttle", help="""
    When the value_throttled property is updated.

    This parameter can take on only one of three options:

    * "continuous": the callback will be executed immediately for each movement of the slider
    * "throttle": the callback will be executed at most every ``callback_throttle`` milliseconds.
    * "mouseup": the callback will be executed only once when the slider is released.

    The "mouseup" policy is intended for scenarios in which the callback is expensive in time.

    Both Python and JS callbacks on "value_throttled" will respect this policy setting.
    """)

    bar_color = Color(default="#e6e6e6", help="""
    """)

    @error(EQUAL_SLIDER_START_END)
    def _check_missing_dimension(self):
        if hasattr(self, 'start') and hasattr(self, 'end'):
            if self.start == self.end:
                return '{!s} with title {!s}'.format(self, self.title)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Slider(AbstractSlider):
    """ Slider-based number selection widget. """

    start = Float(help="""
    The minimum allowable value.
    """)

    end = Float(help="""
    The maximum allowable value.
    """)

    value = Float(help="""
    Initial or selected value.
    """)

    value_throttled = Float(help="""
    Initial or selected value, throttled according to callback_policy.
    """)

    step = Float(default=1, help="""
    The step between consecutive values.
    """)

    format = Override(default="0[.]00")

class RangeSlider(AbstractSlider):
    """ Range-slider based number range selection widget. """

    value = Tuple(Float, Float, help="""
    Initial or selected range.
    """)

    value_throttled = Tuple(Float, Float, help="""
    Initial or selected value, throttled according to callback_policy.
    """)

    start = Float(help="""
    The minimum allowable value.
    """)

    end = Float(help="""
    The maximum allowable value.
    """)

    step = Float(default=1, help="""
    The step between consecutive values.
    """)

    format = Override(default="0[.]00")

class DateSlider(AbstractSlider):
    """ Slider-based date selection widget. """

    value = Date(help="""
    Initial or selected value.
    """)

    value_throttled = Date(help="""
    Initial or selected value, throttled according to callback_policy.
    """)

    start = Date(help="""
    The minimum allowable value.
    """)

    end = Date(help="""
    The maximum allowable value.
    """)

    step = Int(default=1, help="""
    The step between consecutive values.
    """)

    format = Override(default="%d %b %Y")

class DateRangeSlider(AbstractSlider):
    """ Slider-based date range selection widget. """

    @property
    def value_as_datetime(self):
        ''' Convenience property to retrieve the value tuple as a tuple of
        datetime objects.

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
        return d1, d2    \

    @property
    def value_as_date(self):
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

    value = Tuple(Date, Date, help="""
    Initial or selected range.
    """)

    value_throttled = Tuple(Date, Date, help="""
    Initial or selected value, throttled according to callback_policy.
    """)

    start = Date(help="""
    The minimum allowable value.
    """)

    end = Date(help="""
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
