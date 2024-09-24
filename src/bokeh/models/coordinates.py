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

# Bokeh imports
from ..core.properties import (
    Auto,
    Either,
    Enum,
    Instance,
    InstanceDefault,
    Nullable,
)
from ..model import Model
from .ranges import DataRange1d, Range
from .scales import LinearScale, Scale

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "CoordinateMapping",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class CoordinateMapping(Model):
    """ A mapping between two coordinate systems. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    x_source = Instance(Range, default=InstanceDefault(DataRange1d), help="""
    The source range of the horizontal dimension of the new coordinate space.
    """)

    y_source = Instance(Range, default=InstanceDefault(DataRange1d), help="""
    The source range of the vertical dimension of the new coordinate space.
    """)

    x_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
    What kind of scale to use to convert x-coordinates from the source space
    into x-coordinates in the target coordinate space.
    """)

    y_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
    What kind of scale to use to convert y-coordinates from the source space
    into y-coordinates in the target coordinate space.
    """)

    x_target = Either(Instance(Range), Auto, default="auto", help="""
    The horizontal range to map x-coordinates in the target coordinate space.

    If ``"auto"``, then the default x range of the target coordinate
    provider will be used. When targeting the cartesian frame, then
    ``CartesianFrame.x_range`` will be used.
    """)

    y_target = Either(Instance(Range), Auto, default="auto", help="""
    The vertical range to map y-coordinates in the target coordinate space.

    If ``"auto"``, then the default y range of the target coordinate
    provider will be used. When targeting the cartesian frame, then
    ``CartesianFrame.y_range`` will be used.
    """)

    target = Nullable(Enum("frame"), default="frame", help="""
    Specifies the target of this coordinate mapping.

    The target can be either the frame, in which case the resulting scales
    will compose with frame's scales, resulting in a sub-coordinate system.

    Alternatively the target can be ``None``, which implies an absolute
    screen positioning system. This way the user can position renderers
    in arbitrary locations on the canvas, using pixels or derived units.

    .. note::
        This property is experimental and may change at any point.
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
