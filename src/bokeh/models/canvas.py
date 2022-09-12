#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from ..core.enums import OutputBackend
from ..core.properties import (
    Bool,
    Enum,
    Instance,
    InstanceDefault,
)
from ..model import Model
from .ranges import DataRange1d, Range
from .scales import LinearScale, Scale
from .ui import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Canvas",
    "CoordinateMapping",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Canvas(UIElement):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
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

class CoordinateMapping(Model):
    """ A mapping between two coordinate systems. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    x_source = Instance(Range, default=InstanceDefault(DataRange1d))
    y_source = Instance(Range, default=InstanceDefault(DataRange1d))
    x_scale = Instance(Scale, default=InstanceDefault(LinearScale))
    y_scale = Instance(Scale, default=InstanceDefault(LinearScale))
    x_target = Instance(Range)
    y_target = Instance(Range)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
