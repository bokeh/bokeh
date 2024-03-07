#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various kinds of menus. """

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...core.enums import ToolIcon
from ...core.has_props import abstract
from ...core.properties import (
    Bool,
    Either,
    Enum,
    Image,
    Instance,
    List,
    Nullable,
    Regex,
    Required,
    String,
)
from ...model import Model
from ..callbacks import Callback
from .ui_element import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "ActionItem",
    "CheckableItem",
    "DividerItem",
    "Menu",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class MenuItem(Model):
    """ Base class for various kinds of menu items. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class ActionItem(MenuItem):
    """ A basic menu item with an icon, label, shortcut, sub-menu and an associated action.

    Only label is required. All other properties are optional.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    icon = Nullable(Either(Image, Enum(ToolIcon), Regex(r"^--"), Regex(r"^\.")), help="""
    An optional icon to display left of the label.
    """)

    label = Required(String, help="""
    A plain text string label.
    """)

    shortcut = Nullable(String, default=None, help="""
    An optional string representing the keyboard sequence triggering the action.

    .. note::
        This is only a UI hint for the user. Menus on their own don't implement
        any support for triggering actions based on keyboard inputs.
    """)

    menu = Nullable(Instance(lambda: Menu), default=None, help="""
    An optional sub-menu showed when hovering over this item.
    """)

    tooltip = Nullable(String, default=None, help="""
    An optional plain text description showed when hovering over this item.
    """)

    disabled = Bool(default=False, help="""
    Indicates whether clicking on the item activates the associated action.
    """)

    action = Nullable(Instance(Callback), default=None, help="""
    An optional action (callback) associated with this item.
    """)

class CheckableItem(ActionItem):
    """ A two state checkable menu item. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    checked = Bool(default=False, help="""
    The state of the checkable item.

    Checked item is represented with a tick mark on the left hand side
    of an item. Unchecked item is represented with an empty space.
    """)

    # TODO group = Either(Instance(MenuGroup), Auto)

class DividerItem(MenuItem):
    """ A dividing line between two groups of menu items. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class Menu(UIElement):
    """ An implicitly positioned panel containing a collection of items.

    These items can include commands, checked items, dividers, etc.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    items = List(Instance(MenuItem), default=[], help="""
    A collection of menu items representing
    """)

    reversed = Bool(default=False, help="""
    Whether to keep the order of menu's items or reverse it.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
