''' Various kinds of input widgets and form controls.

'''
from __future__ import absolute_import

from ...core.enums import SliderCallbackPolicy
from ...core.has_props import abstract
from ...core.properties import Bool, Date, Either, Enum, Float, Instance, Int, List, RelativeDelta, String, Tuple

from ..callbacks import Callback

from .widget import Widget

@abstract
class InputWidget(Widget):
    ''' Abstract base class for input widgets.

    '''

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
    ''' Single-line input widget.

    '''

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
    ''' Single-line input widget with auto-completion.

    '''

    completions = List(String, help="""
    A list of completion strings. This will be used to guide the
    user upon typing the beginning of a desired value.
    """)


class Select(InputWidget):
    ''' Single-select widget.

    '''

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
    ''' Multi-select widget.

    '''

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

class DatePicker(InputWidget):
    ''' Calendar-based date picker widget.

    '''

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
