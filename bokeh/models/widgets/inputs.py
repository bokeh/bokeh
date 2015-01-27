""" Various kinds of input widgets and form controls. """

from __future__ import absolute_import

import six

from ...properties import Bool, Int, Float, String, Date, RelativeDelta, Enum, List, Dict, Tuple, Either
from ..widget import Widget

class InputWidget(Widget):
    """ Abstract base class for input widgets. """

    title = String(help="""
    Widget's label.
    """)

    name = String(help="""
    Widget's name.
    """)

    value = String(help="""
    Initial or input value.
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

    value = String(help="""
    Initial or entered value.
    """)

class Select(InputWidget):
    """ Single-select widget. """

    options = List(Either(String, Dict(String, String)), help="""
    Available selection options.
    """)

    value = String(help="""
    Initial or selected value.
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

class MultiSelect(Select):
    """ Multi-select widget. """

    value = List(String, help="""
    Initial or selected values.
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
    """ Slider-based number selection widget. """

    value = Float(help="""
    Initial or selected value.
    """)

    start = Float(help="""
    The lowest allowed value.
    """)

    end = Float(help="""
    The biggest allowed value.
    """)

    step = Float(help="""
    The step between consecutive values.
    """)

    orientation = Enum("horizontal", "vertical", help="""
    Orient the slider either horizontally (the default) or vertically.
    """)

class DateRangeSlider(InputWidget):
    """ Slider-based date range selection widget. """

    value = Tuple(Date, Date, help="""
    The initial or selected date range.
    """)

    bounds = Tuple(Date, Date, help="""
    The earlies and latest allowed dates.
    """)

    range = Tuple(RelativeDelta, RelativeDelta, help="""
    ???
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
    Show clickable arrows on both ends of the slider.
    """)

    value_labels = Enum("show", "hide", "change", help="""
    Show or hide value labels on both sides of the slider.
    """)

    wheel_mode = Enum("scroll", "zoom", default=None, help="""
    Optional usage of mouse wheel to do either nothing or scroll/zoom selected range.
    """)

class DatePicker(InputWidget):
    """ Calendar-based date picker widget. """

    value = Date(help="""
    The initial or picked date.
    """)

    min_date = Date(default=None, help="""
    Optional earlies allowed date.
    """)
    max_date = Date(default=None, help="""
    Optional latest allowed date.
    """)
