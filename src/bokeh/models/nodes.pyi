#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import ClassVar, Literal

# Bokeh imports
from .._types import CoordinateLike
from ..core.has_props import abstract
from ..model import Model
from .glyphs import Glyph
from .renderers import GlyphRenderer

ImplicitTarget = Literal["viewport", "canvas", "plot", "frame", "parent"]

@dataclass
class BoxNodes:

    def __init__(self, target: Model | ImplicitTarget) -> None: ...

    @property
    def left(self) -> Node: ...

    @property
    def right(self) -> Node: ...

    @property
    def top(self) -> Node: ...

    @property
    def bottom(self) -> Node: ...

    @property
    def top_left(self) -> Node: ...

    @property
    def top_center(self) -> Node: ...

    @property
    def top_right(self) -> Node: ...

    @property
    def center_left(self) -> Node: ...

    @property
    def center(self) -> Node: ...

    @property
    def center_right(self) -> Node: ...

    @property
    def bottom_left(self) -> Node: ...

    @property
    def bottom_center(self) -> Node: ...

    @property
    def bottom_right(self) -> Node: ...

    @property
    def width(self) -> Node: ...

    @property
    def height(self) -> Node: ...

@abstract
@dataclass(init=False)
class Coordinate(Model):
    ...

@dataclass
class XY(Coordinate):

    x: CoordinateLike = ...

    y: CoordinateLike = ...

@dataclass
class Indexed(Coordinate):

    index: int

    renderer: GlyphRenderer[Glyph]

@dataclass
class Node(Coordinate):

    target: Model | ImplicitTarget = ...

    symbol: str = ...

    offset: int = ...

    canvas: ClassVar[BoxNodes] = ...

    plot: ClassVar[BoxNodes] = ...

    frame: ClassVar[BoxNodes] = ...

    parent: ClassVar[BoxNodes] = ...
