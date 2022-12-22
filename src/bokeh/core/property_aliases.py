#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Reusable common property type aliases.

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
from . import enums
from .property.auto import Auto
from .property.container import Tuple
from .property.either import Either
from .property.enum import Enum
from .property.numeric import Int, NonNegative, Percent
from .property.struct import Optional, Struct

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Anchor",
    "BorderRadius",
    "Padding",
    "TextAnchor",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Pixels = NonNegative(Int)

Anchor = (
    Either(
        Enum(enums.Anchor),
        Tuple(
            Either(Enum(enums.Align), Enum(enums.HAlign), Percent),
            Either(Enum(enums.Align), Enum(enums.VAlign), Percent),
        ),
    )
)

TextAnchor = Either(Anchor, Auto)

BorderRadius = (
    Either(
        Pixels,
        Struct(
            top_left=Optional(Pixels),
            top_right=Optional(Pixels),
            bottom_right=Optional(Pixels),
            bottom_left=Optional(Pixels),
        ),
    )
)

Padding = (
    Either(
        Pixels,
        Tuple(Pixels, Pixels),
        Struct(
            x=Optional(Pixels),
            y=Optional(Pixels),
        ),
        Tuple(Pixels, Pixels, Pixels, Pixels),
        Struct(
            left=Optional(Pixels),
            right=Optional(Pixels),
            top=Optional(Pixels),
            bottom=Optional(Pixels),
        ),
    )
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
