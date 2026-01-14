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
from ...core.property.container import Seq
from ...core.property.either import Either
from ...core.property.enum import Enum
from ...core.property.instance import Instance
from ...core.property.nullable import Nullable
from ...core.property.primitive import Int, String
from ...core.property.required import Required
from ...model import Model
from ...util.helpers import flatten
from ..callbacks import Callback

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "KeyBinding",
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
    *flatten(map(lambda key: [
        key,

        f"Ctrl+{key}",
        f"Shift+{key}",
        f"Alt+{key}",
        f"Meta+{key}",

        f"Ctrl+Shift+{key}",
        f"Ctrl+Alt+{key}",
        f"Ctrl+Meta+{key}",

        f"Ctrl+Shift+Alt+{key}",
        f"Ctrl+Shift+Meta+{key}",
        f"Ctrl+Alt+Meta+{key}",

        f"Shift+Alt+{key}",
        f"Shift+Meta+{key}",

        f"Alt+Meta+{key}",
    ], Key)),
)

class KeyBinding(Model):
    """ Represents an action associated with a key or a sequence of keys.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    description = Required(String, help="""
    Descriptive explanation of the binding.
    """)

    keys = Required(Either(Enum(KeyCombination), Seq(Enum(KeyCombination))), help="""
    A single key combination or a sequence of key combinations.
    """)

    command = Nullable(String, default=None, help="""
    Command name excluding leader character (typically colon).
    """)

    when = Nullable(Instance(Callback), default=None, help="""
    A callback determining when a binding is active or not.
    """)

    action = Required(Instance(Callback), help="""
    An associated action with this binding.
    """)

    priority = Int(default=0, help="""
    Determines which binding to choose when there are multiple competing ones.
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
