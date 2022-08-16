#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from ...core.enums import Orientation
from ...core.has_props import abstract
from ...core.properties import (
    Bool,
    Enum,
    Instance,
    List,
    Nullable,
    Required,
    String,
)
from .icons import Icon
from .ui_element import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Action",
    "Menu",
    "Section",
    "Divider",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class MenuItem(UIElement):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class Action(MenuItem):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    icon = Nullable(Instance(Icon), default=None, help="""
    """)

    label = Required(String, help="""
    """)

    description = Nullable(String, default=None, help="""
    """)

    menu = Nullable(Instance(lambda: Menu), default=None, help="""
    """)

class CheckAction(Action):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    checked = Bool(default=False, help="""
    """)

    # group = Either(Instance(Group), Auto)

class Section(MenuItem):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    items = List(Instance(Action), default=[], help="""
    """)

class Divider(MenuItem):
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

    orientation = Enum(Orientation, default="vertical", help="""
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
