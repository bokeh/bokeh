""" Various kinds of slider widgets.

"""
from __future__ import absolute_import

from ...core.properties import Bool, Float, Date, RelativeDelta, Enum, Tuple, Instance
from ...core.enums import SliderCallbackPolicy
from ..callbacks import Callback
from .inputs import InputWidget

class Slider(InputWidget):
    """ Slider-based number selection widget.

    """

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

    orientation = Enum("horizontal", "vertical", help="""
    Orient the slider either horizontally (default) or vertically.
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

class RangeSlider(InputWidget):
    """ Range-slider based range selection widget

    """

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

    orientation = Enum("horizontal", "vertical", help="""
    Orient the slider either horizontally (default) or vertically.
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


class DateRangeSlider(InputWidget):
    """ Slider-based date range selection widget.

    """

    value = Tuple(Date, Date, help="""
    The initial or selected date range.
    """)

    bounds = Tuple(Date, Date, help="""
    The earliest and latest allowable dates.
    """)

    range = Tuple(RelativeDelta, RelativeDelta, help="""
    [TDB]
    """)

    step = RelativeDelta(help="""
    The step between consecutive dates.
    """)

    # formatter = Either(String, Function(Date))
    # scales = DateRangeSliderScales ... # first, next, stop, label, format

    enabled = Bool(True, help="""
    Enable or disable this widget.
    """)

    arrows = Bool(True, help="""
    Whether to show clickable arrows on both ends of the slider.
    """)

    value_labels = Enum("show", "hide", "change", help="""
    Show or hide value labels on both sides of the slider.
    """)

    wheel_mode = Enum("scroll", "zoom", default=None, help="""
    Whether mouse zoom should scroll or zoom selected range (or
    do nothing).
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever either slider's value changes.
    """)
