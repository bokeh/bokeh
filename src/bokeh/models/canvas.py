#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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
from ..core.enums import OutputBackend
from ..core.properties import Bool, Enum
from .ui import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Canvas",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Canvas(UIElement):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    hidpi = Bool(default=True, help="""
    Whether to use HiDPI mode when available.
    """)

    output_backend = Enum(OutputBackend, default="canvas", help="""
    Specify the output backend for the plot area. Default is HTML5 Canvas.

    .. note::
        When set to ``webgl``, glyphs without a WebGL rendering implementation
        will fall back to rendering onto 2D canvas.
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
