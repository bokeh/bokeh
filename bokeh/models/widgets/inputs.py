""" Various kinds of input widgets and form controls.

"""
from __future__ import absolute_import

from ...core.properties import abstract
from ...core.properties import Bool, Int, Float, String, Date, RelativeDelta, Enum, List, Tuple, Either, Instance
from ..callbacks import Callback
from .widget import Widget
from ...core.enums import SliderCallbackPolicy

@abstract
class InputWidget(Widget):
    """ Abstract base class for input widgets. `InputWidget`` is not
    generally useful to instantiate on its own.

    """

    title = String(default="", help="""
    Widget's label.
    """)

    @classmethod
    def coerce_value(cls, val):
        prop_obj = cls.lookup('value')
        if isinstance(prop_obj, Float):
            return float(val)
        elif isinstance(prop_obj, Int):
            return int(val)
        elif isinstance(prop_obj, String):
            return str(val)
        else:
            return val

class TextInput(InputWidget):
    """ Single-line input widget. """

    value = String(default="", help="""
    Initial or entered text value.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the user unfocuses the TextInput
    widget by hitting Enter or clicking outside of the text box area.
    """)

    placeholder = String(default="", help="""
    Placeholder for empty input field
    """)


class AutocompleteInput(TextInput):
    """ Single-line input widget with auto-completion. """

    completions = List(String, help="""
    A list of completion strings. This will be used to guide the
    user upon typing the beginning of a desired value.
    """)


class Select(InputWidget):
    """ Single-select widget.

    """

    options = List(Either(String, Tuple(String, String)), help="""
    Available selection options. Options may be provided either as a list of
    possible string values, or as a list of tuples, each of the form
    ``(value, label)``. In the latter case, the visible widget text for each
    value will be corresponding given label.
    """)

    value = String(default="", help="""
    Initial or selected value.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the current Select dropdown
    value changes.
    """)

class MultiSelect(InputWidget):
    """ Multi-select widget.

    """

    options = List(Either(String, Tuple(String, String)), help="""
    Available selection options. Options may be provided either as a list of
    possible string values, or as a list of tuples, each of the form
    ``(value, label)``. In the latter case, the visible widget text for each
    value will be corresponding given label.
    """)

    value = List(String, help="""
    Initial or selected values.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the current selection value
    changes.
    """)

    size = Int(default=4, help="""
    The number of visible options in the dropdown list. (This uses the
    ``select`` HTML element's ``size`` attribute. Some browsers might not
    show less than 3 options.)
    """)

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

class DatePicker(InputWidget):
    """ Calendar-based date picker widget.

    """

    value = Date(help="""
    The initial or picked date.
    """)

    min_date = Date(default=None, help="""
    Optional earliest allowable date.
    """)

    max_date = Date(default=None, help="""
    Optional latest allowable date.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the current date value changes.
    """)
