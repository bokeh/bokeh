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

# Bokeh imports
from ...core.enums import Location
from ...core.properties import Bool, Enum, Required
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
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    location = Required(Enum(Location))(help="""
    The attachment edge of the viewport or a component.

    To attach a ``Drawer`` to the viewport, add it as a document root.
    Otherwise add it to another UI component's ``elements`` property.
    """)

    open = Bool(default=False, help="""
    Initial or actual state of the component.
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
