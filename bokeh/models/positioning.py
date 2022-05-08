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
from ..core.enums import Anchor
from ..core.has_props import abstract
from ..core.properties import (
    Enum,
    Instance,
    Int,
    NonNegative,
    NonNullable as Required,
)
from ..model import Model
from .coordinates import Coordinate

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "At",
    "Position",
    "Size",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Size(Model):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    width = Required(NonNegative(Int))
    height = Required(NonNegative(Int))

@abstract
class Position(Model):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class At(Position):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    loc = Required(Instance(Coordinate))
    size = Required(Instance(Size))
    anchor = Enum(Anchor, default="top_left")

"""
class Box(Position):
    top_left: Coordinate
    bottom_right: Coordinate

class LRTB(Position):
    left = Component
    right = Component
    top = Component
    bottom = Component

class Layout(Position):
    pass
"""

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
