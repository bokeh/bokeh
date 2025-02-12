#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Floating UI elements. """

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
from ...core.enums import Location
from ...core.properties import (
    Bool,
    CSSLength,
    Either,
    Enum,
    Float,
    Required,
)
from .panes import Pane

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Drawer",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Drawer(Pane):
    """ A floating panel attachable to an edge of the viewport or a component.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    location = Required(Enum(Location))(help="""
    The attachment edge of the viewport or a component.

    To attach a ``Drawer`` to the viewport, add it as a document root.
    Otherwise add it to another UI component's ``elements`` property.
    """)

    open = Bool(default=False, help="""
    Initial or actual state of the component.
    """)

    size = Either(Float, CSSLength)(default=300, help="""
    The initial or actual size (width or height) of the component.

    This can either be a CSS length value (``20px``, ``1.5em``, ``30vw``, etc.)
    or a number of pixels (equivalent to CSS ``px`` units).
    """)

    resizable = Bool(default=False, help="""
    Whether the component is resizable by dragging its interactive edge.
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
