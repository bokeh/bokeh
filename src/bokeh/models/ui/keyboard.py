#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""

"""

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
from ...core.enums import enumeration
from ...core.property.any import AnyRef
from ...core.property.container import Dict, Seq
from ...core.property.either import Either
from ...core.property.enum import Enum
from ...core.property.instance import Instance
from ...core.property.nullable import Nullable
from ...core.property.primitive import Bool, Int, String
from ...core.property.required import Required
from ...model import Model
from ...util.helpers import flatten
from ..callbacks import Callback, CustomJS
from .ui_element import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "KeyBinding",
    "KeyboardShortcuts",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

UpperKey = enumeration(
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "~", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+",
  "{", "}", "|", ":", "\"", "<", ">", "?",
)

LowerKey = enumeration(
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=",
  "[", "]", "\\", ";", "'", ",", ".", "/",
)

PrintableKey = enumeration(*UpperKey, *LowerKey)

WhitespaceKey = enumeration("Enter", "Tab", "Space", " ")

UIKey = enumeration("Escape")

NavigationKey = enumeration("ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "End", "Home", "PageDown", "PageUp")

EditingKey = enumeration("Backspace", "Delete", "Insert")

FunctionKey = enumeration("F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12")

Key = enumeration(*PrintableKey, *WhitespaceKey, *UIKey, *NavigationKey, *EditingKey, *FunctionKey)

ModifierKey = enumeration("Ctrl", "Shift", "Alt", "Meta")

KeyCombination = enumeration(
    # all subsets of modifiers, in canonical order (Ctrl, Shift, Alt, Meta)
    *flatten(map(lambda key: [
        key,

        f"Ctrl+{key}",
        f"Shift+{key}",
        f"Alt+{key}",
        f"Meta+{key}",

        f"Ctrl+Shift+{key}",
        f"Ctrl+Alt+{key}",
        f"Ctrl+Meta+{key}",
        f"Shift+Alt+{key}",
        f"Shift+Meta+{key}",
        f"Alt+Meta+{key}",

        f"Ctrl+Shift+Alt+{key}",
        f"Ctrl+Shift+Meta+{key}",
        f"Ctrl+Alt+Meta+{key}",
        f"Shift+Alt+Meta+{key}",

        f"Ctrl+Shift+Alt+Meta+{key}",
    ], Key)),
)

class KeyBinding(Model):
    """ Associates a key or a sequence of keys with a command or an action.

    A binding either references a named command (e.g. ``"zoom_in"`` or
    ``"pan"``), optionally with arguments, or provides an ad-hoc ``action``.
    If both are provided, ``action`` takes precedence.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    description = Nullable(String, default=None, help="""
    Descriptive explanation of the binding.

    If not provided, the description of the referenced command is used.
    """)

    keys = Required(Either(Enum(KeyCombination), Seq(Enum(KeyCombination))), help="""
    A single key combination or a sequence of key combinations.
    """)

    command = Nullable(String, default=None, help="""
    Name of the command to execute, excluding the leader character (typically
    colon).
    """)

    args = Dict(String, AnyRef, default={}, help="""
    Arguments to pass to the command.
    """)

    when = Nullable(Instance(CustomJS), default=None, help="""
    A callback determining when a binding is active or not.

    The callback is executed synchronously and must return a boolean. If it
    returns ``False``, the binding is skipped, allowing other bindings of the
    same keys to be considered.
    """)

    action = Nullable(Instance(Callback), default=None, help="""
    An ad-hoc action to execute instead of a command.

    The callback is executed with the plot (or document) the binding belongs
    to as ``cb_obj`` and without ``cb_data``, so callbacks that depend on
    event data (e.g. ``OpenURL``) aren't useful here.
    """)

    priority = Int(default=0, help="""
    Determines which binding to choose when there are multiple competing ones.

    A binding with higher priority wins. Bindings with equal priority are
    tried in the order they were registered.
    """)

class KeyboardShortcuts(UIElement):
    """ Displays key bindings available in a UI element.

    This includes key bindings defined on the element itself, provided by its
    components (e.g. plot's tools), and global key bindings defined on the
    element's document.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    source = Required(Instance(UIElement), help="""
    The UI element (e.g. a plot) whose key bindings are displayed.
    """)

    editable = Bool(default=False, help="""
    Whether key bindings can be changed in the UI.

    .. note::
        This is not supported yet.
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
