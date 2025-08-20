#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Common model properties that can't be defined in ``bokeh.core``.

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
    CoordinateLike,
    Either,
    Instance,
    TypeOfAttr,
)
from ...model import Model
from ..glyph import Glyph
from ..nodes import Node
from ..renderers import GlyphRenderer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Coordinate",
    "GlyphRendererOf",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Coordinate = Either(CoordinateLike, Instance(Node))

def GlyphRendererOf(*types: type[Model]) -> TypeOfAttr[GlyphRenderer[Glyph]]: # TODO parameterized on glyph type
    """ Constraints ``GlyphRenderer.glyph`` to the given type or types. """
    return TypeOfAttr(Instance(GlyphRenderer), "glyph", Either(*(Instance(type) for type in types)))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
