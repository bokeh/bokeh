#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of input widgets and form controls.

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
from math import inf

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import (
    Bool,
    Color,
    ColorHex,
    Dict,
    Either,
    Enum,
    Float,
    Instance,
    Int,
    Interval,
    List,
    NonNegative,
    Null,
    Nullable,
    Override,
    Positive,
    Readonly,
    Required,
    Seq,
    String,
    Tuple,
)
from ..formatters import TickFormatter
from ..ui import Tooltip
from .widget import Widget

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AutocompleteInput',
    'Checkbox',
    'ColorMap',
    'ColorPicker',
    'FileInput',
    'InputWidget',
    'MultiChoice',
    'MultiSelect',
    'NumericInput',
    'PasswordInput',
    'Select',
    'Spinner',
    'Switch',
    'TextAreaInput',
    'TextInput',
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


@abstract
class InputWidget(Widget):
    ''' Abstract base class for input widgets.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    title = String(default="", help="""
    Widget's label.
    """)

    description = Nullable(Either(String, Instance(Tooltip)), default=None, help="""
    Either a plain text or a tooltip with a rich HTML description of the function of this widget.
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

class FileInput(InputWidget):
    ''' Present a file-chooser dialog to users and return the contents of the
    selected files.
    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = Readonly(Either(String, List(String)), help='''
    The base64-enconded contents of the file or files that were loaded.

    If `multiple` is set to False (default), this value is a single string with the contents
    of the single file that was chosen.

    If `multiple` is True, this value is a list of strings, each containing the contents of
    one of the multiple files that were chosen.

    The sequence of files is given by the list of filenames (see below)
    ''')

    mime_type = Readonly(Either(String, List(String)), help='''
    The mime-type of the file or files that were loaded.

    If `multiple` is set to False (default), this value is a single string with the
    mime-type of the single file that was chosen.

    If `multiple` is True, this value is a list of strings, each containing the
    mime-type of one of the multiple files that were chosen.

    The sequence of files is given by the list of filename (see below)
    ''')

    filename = Readonly(Either(String, List(String)), help='''
    The name(s) of the file or files that were loaded.

    If `multiple` is set to False (default), this value is a single string with the
    name of the single file that was chosen.

    If `multiple` is True, this value is a list of strings, each containing the
    name of one of the multiple files that were chosen.

    This list provides the sequence of files for the respective lists in value and mime-type

    .. note::
        The full file path is not included since browsers will not provide
        access to that information for security reasons.
    ''')

    accept = Either(String, List(String), default="", help="""
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

    .. note::
        A bug in some versions of Chrome on macOS Big Sur may limit
        how you can set a file input filter for those users. In those cases,
        it is impossible to limit the user's selection to specific file
        extensions - instead, the browser will limit users to predefined sets of
        file types, such as ``Text/*`` or ``Image/*``. See :bokeh-issue:`10888`
        for more information.
    """)

    multiple = Bool(default=False, help="""
    set multiple=False (default) for single file selection, set multiple=True if
    selection of more than one file at a time should be possible.
    """)


class NumericInput(InputWidget):
    ''' Numeric input widget.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = Either(Null, Float, Int, help="""
    Initial or entered value.

    Change events are triggered whenever <enter> is pressed.
    """)

    low = Either(Null, Float, Int, help="""
    Optional lowest allowable value.
    """)

    high = Either(Null, Float, Int, help="""
    Optional highest allowable value.
    """)

    placeholder = String(default="", help="""
    Placeholder for empty input field.
    """)

    mode = Enum("int", "float", help="""
    Define the type of number which can be enter in the input

    example
    mode int: 1, -1, 156
    mode float: 1, -1.2, 1.1e-25
    """)

    format = Either(Null, String, Instance(TickFormatter), help="""
    """)


class Spinner(NumericInput):
    ''' Numeric Spinner input widget.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value_throttled = Readonly(Either(Null, Float, Int), help="""
    Value reported at the end of interactions.
    """)

    mode = Override(default="float")

    step = Interval(Float, start=1e-16, end=inf, default=1, help="""
    The step added or subtracted to the current value.
    """)

    page_step_multiplier = Interval(Float, start=0, end=inf, default=10, help="""
    Defines the multiplication factor applied to step when the page up and page
    down keys are pressed.
    """)

    wheel_wait = Either(Int, Float, default=100, help="""
    Defines the debounce time in ms before updating `value_throttled` when the
    mouse wheel is used to change the input.
    """)

@abstract
class ToggleInput(Widget):
    """ Base class for toggleable (boolean) input widgets. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    active = Bool(default=False, help="""
    The state of the widget.
    """)

class Checkbox(ToggleInput):
    """ A checkbox widget. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    label = String(default="", help="""
    The label next to the checkbox.
    """)

class Switch(ToggleInput):
    """ A checkbox-like widget. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    width = Override(default=32)

class TextLikeInput(InputWidget):
    ''' Base class for text-like input widgets.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

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

    max_length = Nullable(Int, help="""
    Max count of characters in field
    """)

class TextInput(TextLikeInput):
    ''' Single-line input widget.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    prefix = Nullable(String, help="""
    An optional string prefix to display before the input. This is useful to
    indicate e.g. a variable the entered value will be assigned to.
    """)

    suffix = Nullable(String, help="""
    An optional string suffix to display after the input. This is useful to
    indicate e.g. the units of measurement of the entered value.
    """)

class TextAreaInput(TextLikeInput):
    ''' Multi-line input widget.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    cols = Int(default=20, help="""
    Specifies the width of the text area (in average character width). Default: 20
    """)

    rows = Int(default=2, help="""
    Specifies the height of the text area (in lines). Default: 2
    """)

    max_length = Override(default=500)


class PasswordInput(TextInput):
    ''' Single-line password input widget.

    This widget hides the input value so that it is not visible in the browser.

    .. warning::
        Secure transmission of the password to Bokeh server application code
        requires configuring the server for SSL (i.e. HTTPS) termination.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class AutocompleteInput(TextInput):
    ''' Single-line input widget with auto-completion.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    completions = List(String, help="""
    A list of completion strings. This will be used to guide the
    user upon typing the beginning of a desired value.
    """)

    max_completions = Nullable(Positive(Int), help="""
    Optional maximum number of completions displayed.
    """)

    min_characters = NonNegative(Int, default=2, help="""
    The number of characters a user must type before completions are presented.
    """)

    case_sensitive = Bool(default=True, help="""
    Enable or disable case sensitivity.
    """)

    restrict = Bool(default=True, help="""
    Set to False in order to allow users to enter text that is not present in the list of completion strings.
    """)

    search_strategy = Enum("starts_with", "includes", help="""
    Define how to search the list of completion strings. The default option
    ``"starts_with"`` means that the user's text must match the start of a
    completion string. Using ``"includes"`` means that the user's text can
    match any substring of a completion string.
    """)


class Select(InputWidget):
    ''' Single-select widget.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    options = Either(List(Either(String, Tuple(String, String))),
        Dict(String, List(Either(String, Tuple(String, String)))), help="""
    Available selection options. Options may be provided either as a list of
    possible string values, or as a list of tuples, each of the form
    ``(value, label)``. In the latter case, the visible widget text for each
    value will be corresponding given label. Option groupings can be provided
    by supplying a dictionary object whose values are in the aforementioned
    list format
    """).accepts(List(Either(Null, String)), lambda v: [ "" if item is None else item for item in v ])

    value = String(default="", help="""
    Initial or selected value.
    """).accepts(Null, lambda _: "")

class MultiSelect(InputWidget):
    ''' Multi-select widget.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

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

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

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

    max_items = Nullable(Int, help="""
    The maximum number of items that can be selected.
    """)

    option_limit = Nullable(Int, help="""
    The number of choices that will be rendered in the dropdown.
    """)

    search_option_limit = Nullable(Int, help="""
    The number of choices that will be rendered in the dropdown
    when search string is entered.
    """)

    placeholder = Nullable(String, help="""
    A string that is displayed if not item is added.
    """)

    solid = Bool(default=True, help="""
    Specify whether the choices should be solidly filled.""")

class ColorPicker(InputWidget):
    ''' Color picker widget.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    color = ColorHex(default='#000000', help="""
    The initial color of the picked color (named or hexadecimal)
    """)

class ColorMap(InputWidget):
    ''' Color map picker widget.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = Required(String, help="""
    """)

    items = Required(Seq(Tuple(String, Seq(Color))), help="""
    """)

    swatch_width = NonNegative(Int, default=100, help="""
    """)

    swatch_height = NonNegative(Int, default=20, help="""
    """)

    ncols = Positive(Int, default=1, help="""
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
