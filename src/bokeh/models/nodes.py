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
from typing import Any, ClassVar

# Bokeh imports
from ..core.enums import ImplicitTarget, ImplicitTargetType
from ..core.has_props import abstract
from ..core.properties import (
    Either,
    Enum,
    Instance,
    Int,
    Required,
    String,
)
from ..core.property.aliases import CoordinateLike
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Indexed",
    "Node",
    "XY",
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class BoxNodes:
    """ Provider of box nodes for box-like models. """

    def __init__(self, target: Model | ImplicitTargetType) -> None:
        self.target = target

    def _node(self, symbol: str) -> Node:
        return Node(target=self.target, symbol=symbol)

    @property
    def left(self) -> Node:
        return self._node("left")

    @property
    def right(self) -> Node:
        return self._node("right")

    @property
    def top(self) -> Node:
        return self._node("top")

    @property
    def bottom(self) -> Node:
        return self._node("bottom")

    @property
    def top_left(self) -> Node:
        return self._node("top_left")

    @property
    def top_center(self) -> Node:
        return self._node("top_center")

    @property
    def top_right(self) -> Node:
        return self._node("top_right")

    @property
    def center_left(self) -> Node:
        return self._node("center_left")

    @property
    def center(self) -> Node:
        return self._node("center")

    @property
    def center_right(self) -> Node:
        return self._node("center_right")

    @property
    def bottom_left(self) -> Node:
        return self._node("bottom_left")

    @property
    def bottom_center(self) -> Node:
        return self._node("bottom_center")

    @property
    def bottom_right(self) -> Node:
        return self._node("bottom_right")

    @property
    def width(self) -> Node:
        return self._node("width")

    @property
    def height(self) -> Node:
        return self._node("height")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Coordinate(Model):
    """ A base class for various types of coordinate specifications.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

class XY(Coordinate):
    """ A point in a Cartesian coordinate system.

    .. note::
        This model is experimental and may change at any point.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    x = Required(CoordinateLike, help="""
    The x component.
    """)

    y = Required(CoordinateLike, help="""
    The y component.
    """)

class Indexed(Coordinate):
    """ A coordinate computed given an index into a renderer's data.

    .. note::
        This model is experimental and may change at any point.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    index = Required(Int, help="""
    An index into the data.
    """)

    renderer = Instance(".models.renderers.GlyphRenderer", help="""
    A renderer that is the provider of the data.
    """)

class Node(Coordinate):
    """ Represents a symbolic coordinate (by name).

    .. note::
        This model is experimental and may change at any point.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    target = Required(Either(Instance(Model), Enum(ImplicitTarget)), help="""
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

    canvas: ClassVar[BoxNodes] = BoxNodes("canvas")

    plot: ClassVar[BoxNodes] = BoxNodes("plot")

    frame: ClassVar[BoxNodes] = BoxNodes("frame")

    parent: ClassVar[BoxNodes] = BoxNodes("parent")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
