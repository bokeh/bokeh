#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of input widgets and form controls.

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

# External imports

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import ColorHex, Date, Dict, Either, Float, Instance, Int, List, PositiveInt, String, Tuple

from ..callbacks import Callback

from .widget import Widget

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AutocompleteInput',
    'ColorPicker',
    'DatePicker',
    'FileInput',
    'InputWidget',
    'MultiSelect',
    'PasswordInput',
    'Select',
    'Spinner',
    'TextInput',
    'TextAreaInput'
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


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

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class FileInput(Widget):
    ''' Present a file-chooser dialog to users and return the contents of a
    selected file.

    '''

    value = String(default="", readonly=True, help="""
    A base64-encoded string of the contents of the selected file.
    """)

    mime_type = String(default="", readonly=True, help="""
    The mime type of the selected file.
    """)

    filename = String(default="", readonly=True, help="""
    The filename of the selected file.
    The file path is not included as browsers do not allow access to it.
    """)

    accept = String(default="", help="""
    Comma-separated list of standard HTML file input filters that restrict what
    files the user can pick from. Values can be:

    `<file extension>`:
        Specific file extension(s) (e.g: .gif, .jpg, .png, .doc) are pickable

    `audio/*`:
        all sound files are pickable

    `video/*`:
        all video files are pickable

    `image/*`:
        all image files are pickable

    `<media type>`:
        A valid `IANA Media Type`_, with no parameters.

    .. _IANA Media Type: https://www.iana.org/assignments/media-types/media-types.xhtml
    """)


class TextInput(InputWidget):
    ''' Single-line input widget.

    '''

    value = String(default="", help="""
    Initial or entered text value.
    """)

    value_input = String(default="", help="""
    Initial or entered text value that triggers a callback whenever the value changes.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the user unfocuses the
    ``TextInput`` widget by hitting Enter or clicking outside of the text box
    area.

    DEPRECATED: use .js_on_change or .on_change with "value" or "value_input"
    """)

    placeholder = String(default="", help="""
    Placeholder for empty input field.
    """)


class TextAreaInput(TextInput):
    ''' Multi-line input widget.

    '''

    cols = Int(default=20, help="""
    Specifies the width of the text area (in average character width). Default: 20
    """)

    rows = Int(default=2, help="""
    Specifies the height of the text area (in lines). Default: 2
    """)

    max_length = Int(default=500, help="""
    Max count of characters in field
    """)


class PasswordInput(TextInput):
    ''' Single-line password input widget.
        Note: Despite ``PasswordInput`` inheriting from ``TextInput`` the
        password cannot be inspected on the field ``value``. Also, note that
        this field functionally just hides the input on the browser,
        transmitting safely a password as a callback, e.g., to a bokeh
        server would require some secure connection.

    '''


class AutocompleteInput(TextInput):
    ''' Single-line input widget with auto-completion.

    '''

    completions = List(String, help="""
    A list of completion strings. This will be used to guide the
    user upon typing the beginning of a desired value.
    """)

    min_characters = PositiveInt(default=2, help="""
    The number of characters a user must type before completions are presented.
    """)


class Select(InputWidget):
    ''' Single-select widget.

    '''
    options = Either(List(Either(String, Tuple(Either(Int, String), String))),
        Dict(String, List(Either(String, Tuple(Either(Int, String), String)))), help="""
    Available selection options. Options may be provided either as a list of
    possible string values, or as a list of tuples, each of the form
    ``(value, label)``. In the latter case, the visible widget text for each
    value will be corresponding given label. Option groupings can be provided
    by supplying a dictionary object whose values are in the aforementioned
    list format
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


class ColorPicker(InputWidget):
    ''' Color picker widget

    .. warning::
        This widget as a limited support on *Internet Explorer* (it will be displayed
        as a simple text input).

    '''

    color = ColorHex(default='#000000', help="""
    The initial color of the picked color (named or hexadecimal)
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the current date value changes.
    """)


class Spinner(InputWidget):
    ''' Spinner widget for numerical inputs

    '''

    value = Float(default=0, help="""
    The initial value of the spinner
    """)

    step = Float(default=1, help="""
    The step added or subtracted to the current value
    """)

    low = Float(help="""
    Optional lowest allowable value.
    """)

    high = Float(help="""
    Optional highest allowable value.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the user unfocuses the
    ``SpinBox`` widget by hitting Enter or clicking outside of the box
    area.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
