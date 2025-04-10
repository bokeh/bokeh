#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various kinds of panels. """

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
    Auto,
    Either,
    Instance,
    Int,
    Required,
)
from ...core.property_aliases import Anchor
from ..nodes import Coordinate, Node
from .panes import Pane

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Panel",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Panel(Pane):
    """ A DOM-based UI element that allows for controlling its bounding box. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    position = Required(Instance(Coordinate), help="""
    A computed coordinate representing the position of this panel, either
    with respect to its parent or the viewport of a web browser.
    """)

    anchor = Anchor(default="top_left", help="""
    The anchor point this panel is positioned at.

    This can be either a named anchor like ``"top_left"`` or ``"center"``,
    or a tuple of named positions or percentages along the axes of the panel
    """)

    width = Either(Auto, Int, Instance(Node), help="""
    A computed value defining the width of the panel.

    Use ``"auto"`` to let CSS determine the width (based on a stylesheet).
    """)

    height = Either(Auto, Int, Instance(Node), help="""
    A computed value defining the height of the panel.

    Use ``"auto"`` to let CSS determine the height (based on a stylesheet).
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
