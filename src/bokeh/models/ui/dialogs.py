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
from ...core.enums import Movable, Resizable
from ...core.properties import (
    Bool,
    Either,
    Enum,
    Instance,
    Nullable,
    Required,
    String,
)
from ...core.property_aliases import Anchor
from ..dom import DOMNode
from ..nodes import Node
from .ui_element import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Dialog",
    "Panel",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Limit = Instance(Node)

class Panel(UIElement):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    #target = Nullable(Instance(UIElement), default=None)
    position = Required(Instance(Node))
    anchor = Anchor(default="top_left")
    content = Required(Either(String, Instance(DOMNode), Instance(UIElement)))

class Dialog(UIElement):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    title = Nullable(Either(String, Instance(DOMNode), Instance(UIElement)))
    content = Required(Either(String, Instance(DOMNode), Instance(UIElement)))

    collapsible = Bool(default=True)
    minimizable = Bool(default=True)
    maximizable = Bool(default=True)
    closable = Bool(default=True)

    resizable = Enum(Resizable, default="all")
    movable = Enum(Movable, default="both")
    symmetric = Bool(default=False)

    top_limit = Nullable(Limit, default=None)
    bottom_limit = Nullable(Limit, default=None)
    left_limit = Nullable(Limit, default=None)
    right_limit = Nullable(Limit, default=None)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
