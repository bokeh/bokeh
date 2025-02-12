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

# Standard library imports
from typing import Any

# Bokeh imports
from ...core.properties import (
    Bool,
    Either,
    Instance,
    List,
    Null,
    Nullable,
    Required,
    String,
)
from ...core.property_aliases import IconLike
from ...model import Model
from ...util.deprecation import deprecated
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
    "MenuItem",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class MenuItem(Model):
    """ A basic menu item with an icon, label, shortcut, sub-menu and an associated action.

    Only label is required. All other properties are optional.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    checked = Nullable(Bool, default=None, help="""
    Whether an item is marked as checked/active.

    Checked item is represented with a tick mark on the left hand side
    of an item. Unchecked item is represented with an empty space.

    The menu will allocate a column for check marks for all its items if
    at least one item has set a boolean value for ``checked`` property.
    """)

    icon = Nullable(IconLike, help="""
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

class ActionItem(MenuItem):

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        deprecated((3, 7, 0), "ActionItem", "MenuItem")
        super().__init__(*args, **kwargs)

class CheckableItem(MenuItem):
    """ A two state checkable menu item. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        deprecated((3, 7, 0), "CheckableItem", "ActionItem.checked")
        super().__init__(*args, **kwargs)

class DividerItem(Model):
    """ A dividing line between two groups of menu items. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

class Menu(UIElement):
    """ An implicitly positioned panel containing a collection of items.

    These items can include commands, checked items, dividers, etc.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    items = List(Either(Instance(MenuItem), Instance(DividerItem), Null), default=[], help="""
    A collection of menu items representing the contents of this menu.
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
