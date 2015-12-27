""" Various kinds of input widgets and form controls.

"""
from __future__ import absolute_import

import six

from ...core.properties import abstract
from ...core.properties import Bool, Int, Float, String, Date, RelativeDelta, Enum, List, Dict, Tuple, Either, Instance
from ..callbacks import Callback
from .widget import Widget

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

    @classmethod
    def create(cls, *args, **kwargs):
        """ Only called the first time we make an object,
        whereas __init__ is called every time it's loaded

        """
        if kwargs.get('title') is None:
            kwargs['title'] = kwargs['name']
        if kwargs.get('value') is not None:
            kwargs['value'] = cls.coerce_value(kwargs.get('value'))
        return cls(**kwargs)

class TextInput(InputWidget):
    """ Single-line input widget. """

    value = String(default="", help="""
    Initial or entered text value.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the user unfocuses the TextInput
    widget by hitting Enter or clicking outside of the text box area.
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

    options = List(Either(String, Dict(String, String)), help="""
    Available selection options.
    """)

    value = String(default="", help="""
    Initial or selected value.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the current Select dropdown
    value changes.
    """)

    @classmethod
    def create(self, *args, **kwargs):
        options = kwargs.pop('options', [])
        new_options = []
        for opt in options:
            if isinstance(opt, six.string_types):
                opt = {'name' : opt, 'value' : opt}
            new_options.append(opt)
        kwargs['options'] = new_options
        return super(Select, self).create(*args, **kwargs)

class MultiSelect(InputWidget):
    """ Multi-select widget.

    """

    options = List(Either(String, Dict(String, String)), help="""
    Available selection options.
    """)

    value = List(String, help="""
    Initial or selected values.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the current dropdown value
    changes.
    """)

    @classmethod
    def create(self, *args, **kwargs):
        options = kwargs.pop('options', [])
        new_options = []
        for opt in options:
            if isinstance(opt, six.string_types):
                opt = {'name' : opt, 'value' : opt}
            new_options.append(opt)
        kwargs['options'] = new_options
        return super(Select, self).create(*args, **kwargs)

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
