#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of button widgets.

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
from ...core.enums import ButtonType
from ...core.has_props import abstract, HasProps
from ...core.properties import Bool, Enum, Instance, List, Override, String, Tuple, Either, Int
from ...events import ButtonClick, MenuItemClick

from ..callbacks import Callback

from .icons import AbstractIcon
from .widget import Widget

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AbstractButton',
    'Button',
    'ButtonLike',
    'Dropdown',
    'Toggle',
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class ButtonLike(HasProps):
    ''' Shared properties for button-like widgets.

    '''

    button_type = Enum(ButtonType, help="""
    A style for the button, signifying it's role.
    """)

@abstract
class AbstractButton(Widget, ButtonLike):
    ''' A base class that defines common properties for all button types.

    '''

    label = String("", help="""
    The text label for the button to display.
    """)

    icon = Instance(AbstractIcon, help="""
    An optional image appearing to the left of button's text.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the button is activated.
    """)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Button(AbstractButton):
    ''' A click button.

    '''

    label = Override(default="Button")

    clicks = Int(0, help="""
    A private property that used to trigger ``on_click`` event handler.

    .. note:
        This property is deprecated and left for backwards compatibility. Use
        ``button.on_click()`` or ``button.js_on_click()`` methods in new code.
    """)

    def on_click(self, handler):
        ''' Set up a handler for button clicks.

        Args:
            handler (func) : handler function to call when button is clicked.

        Returns:
            None

        '''
        self.on_event(ButtonClick, handler)

    def js_on_click(self, handler):
        ''' Set up a JavaScript handler for button clicks. '''
        self.js_on_event(ButtonClick, handler)

class Toggle(AbstractButton):
    ''' A two-state toggle button.

    '''

    label = Override(default="Toggle")

    active = Bool(False, help="""
    The initial state of a button. Also used to trigger ``on_click`` event
    handler.
    """)

    def on_click(self, handler):
        """ Set up a handler for button state changes (clicks).

        Args:
            handler (func) : handler function to call when button is toggled.

        Returns:
            None

        """
        self.on_change('active', lambda attr, old, new: handler(new))

    def js_on_click(self, handler):
        """ Set up a JavaScript handler for button state changes (clicks). """
        self.js_on_change('active', handler)

class Dropdown(AbstractButton):
    ''' A dropdown button.

    '''

    label = Override(default="Dropdown")

    split = Bool(default=False, help="""
    """)

    menu = List(Either(String, Tuple(String, Either(String, Instance(Callback)))), help="""
    Button's dropdown menu consisting of entries containing item's text and
    value name. Use ``None`` as a menu separator.
    """)

    def on_click(self, handler):
        ''' Set up a handler for button or menu item clicks.

        Args:
            handler (func) : handler function to call when button is activated.

        Returns:
            None

        '''
        self.on_event(ButtonClick, handler)
        self.on_event(MenuItemClick, handler)

    def js_on_click(self, handler):
        ''' Set up a JavaScript handler for button or menu item clicks. '''
        self.js_on_event(ButtonClick, handler)
        self.js_on_event(MenuItemClick, handler)

    value = String(help="""
    A private property that used to trigger ``on_click`` event handler.

    .. note:
        This property is deprecated and left for backwards compatibility. Use
        ``dropdown.on_click()`` or ``dropdown.js_on_click()`` methods in new code.
    """)

    default_value = String(help="""
    A default value to set when a split Dropdown's top button is clicked.

    Setting this property will cause the Dropdown to be rendered as split.

    .. note:
        This property is deprecated and left for backwards compatibility. Use
        ``dropdown.on_click()`` or ``dropdown.js_on_click()`` methods in new code.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
