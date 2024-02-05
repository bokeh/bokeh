#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2024, Anaconda, Inc., and Bokeh Contributors.
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
    "CheckAction",
    "Menu",
    "MenuAction",
    "MenuDivider",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class MenuItem(Model):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class MenuAction(MenuItem):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    icon = Nullable(Either(Image, Enum(ToolIcon), Regex(r"^--"), Regex(r"^\.")), help="""
    """)

    label = Required(String, help="""
    """)

    tooltip = Nullable(String, default=None, help="""
    """)

    shortcut = Nullable(String, default=None, help="""
    """)

    menu = Nullable(Instance(lambda: Menu), default=None, help="""
    """)

    disabled = Bool(default=False, help="""
    """)

    action = Nullable(Instance(Callback), default=None, help="""
    """)

class CheckAction(MenuAction):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    checked = Bool(default=False, help="""
    """)

    # group = Either(Instance(Group), Auto)

class MenuDivider(MenuItem):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class Menu(UIElement):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    items = List(Instance(MenuItem), default=[], help="""
    """)

    reversed = Bool(default=False, help="""
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
