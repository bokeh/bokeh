""" Various kinds of slider widgets.

"""
from __future__ import absolute_import

from ...core.properties import Bool, Int, Float, Date, Enum, Tuple, Instance, Color
from ...core.enums import SliderCallbackPolicy
from ..callbacks import Callback
from .widget import Widget

class AbstractSlider(Widget):
    """ """

    orientation = Enum("horizontal", "vertical", help="""
    Orient the slider either horizontally (default) or vertically.
    """)

    direction = Enum("ltr", "rtl", help="""
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the current Slider value changes.
    """)

    callback_throttle = Float(default=200, help="""
    Number of microseconds to pause between callback calls as the slider is moved.
    """)

    callback_policy = Enum(SliderCallbackPolicy, default="throttle", help="""
    When the callback is initiated. This parameter can take on only one of three options:

    * "continuous": the callback will be executed immediately for each movement of the slider
    * "throttle": the callback will be executed at most every ``callback_throttle`` milliseconds.
    * "mouseup": the callback will be executed only once when the slider is released.

    The "mouseup" policy is intended for scenarios in which the callback is expensive in time.
    """)

    bar_color = Color(default="#3fb8af", help="""
    """)

class Slider(AbstractSlider):
    """ Slider-based number selection widget. """

    value = Float(default=0.5, help="""
    Initial or selected value.
    """)

    start = Float(default=0, help="""
    The minimum allowable value.
    """)

    end = Float(default=1, help="""
    The maximum allowable value.
    """)

    step = Float(default=0.1, help="""
    The step between consecutive values.
    """)

class RangeSlider(AbstractSlider):
    """ Range-slider based number range selection widget. """

    range = Tuple(Float, Float, default=(0.1, 0.9), help="""
    Initial or selected range.
    """)

    start = Float(default=0, help="""
    The minimum allowable value.
    """)

    end = Float(default=1, help="""
    The maximum allowable value.
    """)

    step = Float(default=0.1, help="""
    The step between consecutive values.
    """)

class DateSlider(AbstractSlider):
    """ Slider-based date selection widget. """

    value = Date(help="""
    Initial or selected value.
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

class DateRangeSlider(AbstractSlider):
    """ Slider-based date range selection widget. """

    range = Tuple(Date, Date, help="""
    Initial or selected range.
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
