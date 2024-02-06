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
    """  """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    position = Required(Instance(Coordinate), help="""
    """)

    anchor = Anchor(default="top_left", help="""
    """)

    width = Either(Auto, Int, Instance(Node), help="""
    """)

    height = Either(Auto, Int, Instance(Node), help="""
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
