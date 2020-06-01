#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of input widgets and form controls.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...core.enums import CalendarPosition
from ...core.has_props import abstract
from ...core.properties import (
    Bool,
    ColorHex,
    Date,
    Dict,
    Either,
    Enum,
    Float,
    Int,
    Interval,
    List,
    PositiveInt,
    String,
    Tuple,
)
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
    'MultiChoice',
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
    ''' Present a file-chooser dialog to users and return the contents of the
    selected files.
    '''

    value = Either(String, List(String), default='', readonly=True, help='''
    The base64-enconded contents of the file or files that were loaded.

    If `mulitiple` is set to False (default), this value is a single string with the contents
    of the single file that was chosen.

    If `multiple` is True, this value is a list of strings, each containing the contents of
    one of the multiple files that were chosen.

    The sequence of files is given by the list of filenames (see below)
    ''')

    mime_type = Either(String, List(String), default='', readonly=True, help='''
    The mime-type of the file or files that were loaded.

    If `mulitiple` is set to False (default), this value is a single string with the
    mime-type of the single file that was chosen.

    If `multiple` is True, this value is a list of strings, each containing the
    mime-type of one of the multiple files that were chosen.

    The sequence of files is given by the list of filename (see below)
    ''')

    filename = Either(String, List(String), default='', readonly=True, help='''
    The name(s) of the file or files that were loaded.

    If `mulitiple` is set to False (default), this value is a single string with the
    name of the single file that was chosen.

    If `multiple` is True, this value is a list of strings, each containing the
    name of one of the multiple files that were chosen.

    This list provides the sequence of files for the respective lists in value and mime-type

    .. note::
        The full file path is not included since browsers will not provide
        access to that information for security reasons.
    ''')

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

    multiple = Bool(default=False, help="""
    set multiple=False (default) for single file selection, set multiple=True if
    selection of more than one file at a time should be possible.
    """)


class TextInput(InputWidget):
    ''' Single-line input widget.

    '''

    value = String(default="", help="""
    Initial or entered text value.

    Change events are triggered whenever <enter> is pressed.
    """)

    value_input = String(default="", help="""
    Initial or current value.

    Change events are triggered whenever any update happens, i.e. on every
    keypress.
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

    This widget hides the input value so that it is not visible in the browser.

    .. warning::
        Secure transmission of the password to Bokeh server application code
        requires configuring the server for SSL (i.e. HTTPS) termination.

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

    case_sensitive = Bool(default=True, help="""Enable or disable case sensitivity""")

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

    size = Int(default=4, help="""
    The number of visible options in the dropdown list. (This uses the
    ``select`` HTML element's ``size`` attribute. Some browsers might not
    show less than 3 options.)
    """)


class MultiChoice(InputWidget):
    ''' MultiChoice widget.

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

    delete_button = Bool(default=True, help="""
    Whether to add a button to remove a selected option.
    """)

    max_items = Int(default=None, help="""
    The maximum number of items that can be selected.
    """)

    option_limit = Int(default=None, help="""
    The number of choices that will be rendered in the dropdown.
    """)

    placeholder = String(default=None, help="""
    A string that is displayed if not item is added.
    """)

    solid = Bool(default=True, help="""
    Specify whether the choices should be solidly filled.""")


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

    disabled_dates = List(Either(Date, Tuple(Date, Date)), default=[], help="""
    A list of dates of ``(start, end)`` date ranges to make unavailable for
    selection. All other dates will be avalable.

    .. note::
        Only one of ``disabled_dates`` and ``enabled_dates`` should be specified.
    """)

    enabled_dates = List(Either(Date, Tuple(Date, Date)), default=[], help="""
    A list of dates of ``(start, end)`` date ranges to make available for
    selection. All other dates will be unavailable.

    .. note::
        Only one of ``disabled_dates`` and ``enabled_dates`` should be specified.
    """)

    position = Enum(CalendarPosition, default="auto", help="""
    Where the calendar is rendered relative to the input when ``inline`` is False.
    """)

    inline = Bool(default=False, help="""
    Whether the calendar sholud be displayed inline.
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

class Spinner(InputWidget):
    ''' Spinner widget for numerical inputs

    '''

    value = Float(default=0, help="""
    The initial value of the spinner
    """)

    step = Interval(Float, start=1e-16, end=float('inf'), default=1, help="""
    The step added or subtracted to the current value
    """)

    low = Float(help="""
    Optional lowest allowable value.
    """)

    high = Float(help="""
    Optional highest allowable value.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
