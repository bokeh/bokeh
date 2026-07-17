#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various kinds of renderers.

"""
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportAttributeAccessIssue=false, reportUnsupportedDunderAll=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from . import (
    contour_renderer,
    glyph_renderer,
    graph_renderer,
    renderer,
    tile_renderer,
)
from .contour_renderer import *
from .glyph_renderer import *
from .graph_renderer import *
from .renderer import *
from .tile_renderer import *

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# Keep dynamic submodule __all__ aggregation visible to type checkers.
def _all(module: Any) -> tuple[str, ...]:
    return module.__all__

__all__ = (
    *_all(contour_renderer),
    *_all(glyph_renderer),
    *_all(graph_renderer),
    *_all(renderer),
    *_all(tile_renderer),
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
