#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
    Either,
    Enum,
    Instance,
    InstanceDefault,
    Int,
    Required,
    String,
)
from ..core.property.singletons import Optional, Undefined
from ..model import Model
from .ranges import DataRange1d, Range
from .scales import LinearScale, Scale

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "CoordinateMapping",
    "Node",
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
    What kind of scale to use to convert x-coordinates from the source (data)
    space into x-coordinates in the target (possibly screen) coordinate space.
    """)

    y_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
    What kind of scale to use to convert y-coordinates from the source (data)
    space into y-coordinates in the target (possibly screen) coordinate space.
    """)

    x_target = Instance(Range, help="""
    The horizontal range to map x-coordinates in the target coordinate space.
    """)

    y_target = Instance(Range, help="""
    The vertical range to map y-coordinates in the target coordinate space.
    """)

class Node(Model):
    """
    Represents a symbolic coordinate (by name).

    .. note::
        This model is experimental and may change at any point.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    target = Required(Either(Instance(Model), Enum("canvas", "plot", "frame", "parent")), help="""
    The provider of coordinates for this node.

    This can be either a concrete model that can provide its coordinates (e.g.
    a renderer, a frame or a canvas) or an implicit target defined by the
    enum, which is resolved as the nearest parent of the given type. If the
    provider cannot be determined or it isn't able to provide coordinates,
    then the node resolved to an invalid coordinate (with x and y components
    being ``NaN``).
    """)

    symbol = Required(String, help="""
    A symbolic name of a coordinate to provide.

    The allowed terms are dependent on the target of this node. For example,
    for box-like targets this will comprise of box anchors (e.g. center, top
    left) and box edges (e.g. top, left).
    """)

    offset = Int(default=0, help="""
    Optional pixel offset for the computed coordinate.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def FrameLeft(*, offset: Optional[int] = Undefined) -> Node:
    return Node(target="frame", symbol="left", offset=offset)

def FrameRight(*, offset: Optional[int] = Undefined) -> Node:
    return Node(target="frame", symbol="right", offset=offset)

def FrameTop(*, offset: Optional[int] = Undefined) -> Node:
    return Node(target="frame", symbol="top", offset=offset)

def FrameBottom(*, offset: Optional[int] = Undefined) -> Node:
    return Node(target="frame", symbol="bottom", offset=offset)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
