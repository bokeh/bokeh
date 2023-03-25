#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of button widgets.

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
from typing import TYPE_CHECKING, Callable

# Bokeh imports
from ...core.enums import ButtonType
from ...core.has_props import HasProps, abstract
from ...core.properties import (
    Bool,
    Either,
    Enum,
    Instance,
    List,
    Nullable,
    Override,
    Required,
    String,
    Tuple,
)
from ...events import ButtonClick, MenuItemClick
from ..callbacks import Callback
from ..ui.icons import BuiltinIcon, Icon
from ..ui.tooltips import Tooltip
from .widget import Widget

if TYPE_CHECKING:
    from ...util.callback_manager import EventCallback

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AbstractButton',
    'Button',
    'ButtonLike',
    'Dropdown',
    'HelpButton',
    'Toggle',
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class ButtonLike(HasProps):
    ''' Shared properties for button-like widgets.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    button_type = Enum(ButtonType, help="""
    A style for the button, signifying it's role. Possible values are one of the
    following:

    .. bokeh-plot::
        :source-position: none

        from bokeh.core.enums import ButtonType
        from bokeh.io import show
        from bokeh.layouts import column
        from bokeh.models import Button

        show(column(
            [Button(label=button_type, button_type=button_type) for button_type in ButtonType]
            ))
    """)

@abstract
class AbstractButton(Widget, ButtonLike):
    ''' A base class that defines common properties for all button types.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    label = String("Button", help="""
    The text label for the button to display.
    """)

    icon = Nullable(Instance(Icon), help="""
    An optional image appearing to the left of button's text. An instance of
    :class:`~bokeh.models.Icon` (such as :class:`~bokeh.models.BuiltinIcon`,
    :class:`~bokeh.models.SVGIcon`, or :class:`~bokeh.models.TablerIcon`).`
    """)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Button(AbstractButton):
    ''' A click button.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    label = Override(default="Button")

    def on_click(self, handler: EventCallback) -> None:
        ''' Set up a handler for button clicks.

        Args:
            handler (func) : handler function to call when button is clicked.

        Returns:
            None

        '''
        self.on_event(ButtonClick, handler)

    def js_on_click(self, handler: Callback) -> None:
        ''' Set up a JavaScript handler for button clicks. '''
        self.js_on_event(ButtonClick, handler)

class Toggle(AbstractButton):
    ''' A two-state toggle button.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    label = Override(default="Toggle")

    active = Bool(False, help="""
    The state of the toggle button.
    """)

    def on_click(self, handler: Callable[[bool], None]) -> None:
        """ Set up a handler for button state changes (clicks).

        Args:
            handler (func) : handler function to call when button is toggled.

        Returns:
            None
        """
        self.on_change('active', lambda attr, old, new: handler(new))

    def js_on_click(self, handler: Callback) -> None:
        """ Set up a JavaScript handler for button state changes (clicks). """
        self.js_on_change('active', handler)

class Dropdown(AbstractButton):
    ''' A dropdown button.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    label = Override(default="Dropdown")

    split = Bool(default=False, help="""
    """)

    menu = List(Nullable(Either(String, Tuple(String, Either(String, Instance(Callback))))), help="""
    Button's dropdown menu consisting of entries containing item's text and
    value name. Use ``None`` as a menu separator.
    """)

    def on_click(self, handler: EventCallback) -> None:
        ''' Set up a handler for button or menu item clicks.

        Args:
            handler (func) : handler function to call when button is activated.

        Returns:
            None

        '''
        self.on_event(ButtonClick, handler)
        self.on_event(MenuItemClick, handler)

    def js_on_click(self, handler: Callback) -> None:
        ''' Set up a JavaScript handler for button or menu item clicks. '''
        self.js_on_event(ButtonClick, handler)
        self.js_on_event(MenuItemClick, handler)

class HelpButton(AbstractButton):
    """ A button with a help symbol that displays additional text when hovered
    over or clicked.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    tooltip = Required(Instance(Tooltip), help="""
    A tooltip with plain text or rich HTML contents, providing general help or
    description of a widget's or component's function.
    """)

    label = Override(default="")

    icon = Override(default=lambda: BuiltinIcon("help", size=18))

    button_type = Override(default="default")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
