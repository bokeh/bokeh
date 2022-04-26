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

# Standard library imports
from math import inf

# Bokeh imports
from ..core.enums import (
    AngleUnits,
    CoordinateUnits,
    Direction,
    RadiusDimension,
)
from ..core.has_props import HasProps, Qualified, abstract
from ..core.properties import (
    Angle,
    Bool,
    Either,
    Enum,
    Float,
    Include,
    Instance,
    Int,
    List,
    NonNegative,
    NonNullable as Required,
    Nullable,
    Override,
    Seq,
    String,
)
from ..core.property_mixins import ScalarFillProps, ScalarHatchProps, ScalarLineProps
from .annotations.geometry import Directions, Edges
from .coordinates import Coordinate, Distance, Node
from .graphics import Decoration
from .renderers import Renderer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "AnnularWedge",
    "Annulus",
    "Arc",
    "Bezier",
    "Box",
    "Circle",
    "Line",
#   "Polygon",
#   "Polyline",
    "Rect",
#   "Slope",
#   "Span",
    "Spline",
    "Wedge",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Shape(Renderer, Qualified):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    level = Override(default="annotation")

@abstract
class Path(HasProps):

    line_props = Include(ScalarLineProps)

@abstract
class Area(HasProps):

    fill_props = Include(ScalarFillProps)
    hatch_props = Include(ScalarHatchProps)
    line_props = Include(ScalarLineProps)

class AnnularWedge(Shape, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._nodes = AnnularWedgeNodes(self)

    center = Required(Instance(Coordinate))

    inner_radius = Required(NonNegative(Float))
    outer_radius = Required(NonNegative(Float))
    radius_dimension = Enum(RadiusDimension, default="x")

    start_angle = Required(Angle)
    end_angle = Required(Angle)
    angle_units = Enum(AngleUnits, default="rad")
    direction = Enum(Direction, default="anticlock")

    editable = Bool(default=False)

    @property
    def nodes(self) -> AnnularWedgeNodes:
        return self._nodes

class Annulus(Shape, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._nodes = AnnulusNodes(self)

    center = Required(Instance(Coordinate))

    inner_radius = Required(NonNegative(Float))
    outer_radius = Required(NonNegative(Float))
    radius_dimension = Enum(RadiusDimension, default="x")

    editable = Bool(default=False)

    @property
    def nodes(self) -> AnnulusNodes:
        return self._nodes

class Arc(Shape, Path):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._nodes = ArcNodes(self)

    center = Required(Instance(Coordinate))

    radius = Required(NonNegative(Float))
    radius_dimension = Enum(RadiusDimension, default="x")

    start_angle = Required(Angle)
    end_angle = Required(Angle)
    angle_units = Enum(AngleUnits, default="rad")
    direction = Enum(Direction, default="anticlock")

    decorations = List(Instance(Decoration), default=[])

    @property
    def nodes(self) -> ArcNodes:
        return self._nodes

class Bezier(Shape, Path):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._nodes = BezierNodes(self)

    p0 = Required(Instance(Coordinate))
    p1 = Required(Instance(Coordinate))

    cp0 = Required(Instance(Coordinate))
    cp1 = Nullable(Instance(Coordinate), default=None)

    @property
    def nodes(self) -> BezierNodes:
        return self._nodes

class Box(Shape, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._nodes = BoxNodes(self)

    left = Required(Float)
    right = Required(Float)
    bottom = Required(Float)
    top = Required(Float)

    left_units = Enum(CoordinateUnits, default="data")
    right_units = Enum(CoordinateUnits, default="data")
    bottom_units = Enum(CoordinateUnits, default="data")
    top_units = Enum(CoordinateUnits, default="data")

    editable = Bool(default=False)

    movable = Int(default=Directions.all).accepts(String, lambda key: getattr(Directions, key)) # TODO: Flags(Directions)
    resizable = Int(default=Edges.all).accepts(String, lambda key: getattr(Edges, key)) # TODO: Flags(Edges)

    min_width = Float(default=0)
    max_width = Float(default=inf)
    min_height = Float(default=0)
    max_height = Float(default=inf)
    aspect = Nullable(Float)

    min_left = Nullable(Float)
    max_left = Nullable(Float)
    min_right = Nullable(Float)
    max_right = Nullable(Float)
    min_top = Nullable(Float)
    max_top = Nullable(Float)
    min_bottom = Nullable(Float)
    max_bottom = Nullable(Float)

    @property
    def nodes(self) -> BoxNodes:
        return self._nodes

class Circle(Shape, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._nodes = CircleNodes(self)

    center = Required(Instance(Coordinate))

    radius = Required(Either(NonNegative(Float), Instance(Distance)))
    radius_dimension = Enum(RadiusDimension, default="x")

    editable = Bool(default=False)

    @property
    def nodes(self) -> CircleNodes:
        return self._nodes

class Line(Shape, Path):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._nodes = LineNodes(self)

    p0 = Required(Instance(Coordinate))
    p1 = Required(Instance(Coordinate))

    @property
    def nodes(self) -> LineNodes:
        return self._nodes

class Rect(Shape, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._nodes = RectNodes(self)

    center = Required(Instance(Coordinate))

    width = Required(NonNegative(Float))
    height = Required(NonNegative(Float))

    angle = Required(Angle)
    angle_units = Enum(AngleUnits, default="rad")
    direction = Enum(Direction, default="anticlock")

    @property
    def nodes(self) -> RectNodes:
        return self._nodes

class Spline(Shape, Path):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._nodes = SplineNodes(self)

    xs = Seq(Float, default=[])
    ys = Seq(Float, default=[])
    xs_units = Enum(CoordinateUnits, default="data")
    ys_units = Enum(CoordinateUnits, default="data")

    tension = Float(default=0.5)
    closed = Bool(default=False)

    @property
    def nodes(self) -> SplineNodes:
        return self._nodes

class Wedge(Shape, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._nodes = WedgeNodes(self)

    center = Required(Instance(Coordinate))

    radius = Required(NonNegative(Float))
    radius_dimension = Enum(RadiusDimension, default="x")

    start_angle = Required(Angle)
    end_angle = Required(Angle)
    angle_units = Enum(AngleUnits, default="rad")
    direction = Enum(Direction, default="anticlock")

    editable = Bool(default=False)

    @property
    def nodes(self) -> WedgeNodes:
        return self._nodes

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Nodes:

    def __init__(self, target: Renderer) -> None:
        self.target = target

class AnnularWedgeNodes(Nodes):

    def __init__(self, target: Renderer) -> None:
        super().__init__(target)

class AnnulusNodes(Nodes):

    def __init__(self, target: Renderer) -> None:
        super().__init__(target)

class ArcNodes(Nodes):

    _start: Node | None
    _end: Node | None

    def __init__(self, target: Renderer) -> None:
        super().__init__(target)
        self._start = None
        self._end = None

    @property
    def start(self) -> Node:
        if self._start is None:
            self._start = Node(target=self.target, term="start")
        return self._start

    @property
    def end(self) -> Node:
        if self._end is None:
            self._end = Node(target=self.target, term="end")
        return self._end

class BezierNodes(Nodes):

    def __init__(self, target: Renderer) -> None:
        super().__init__(target)

class BoxNodes(Nodes):

    def __init__(self, target: Renderer) -> None:
        super().__init__(target)

class CircleNodes(Nodes):

    _center: Node | None

    def __init__(self, target: Renderer) -> None:
        super().__init__(target)
        self._center = None

    @property
    def center(self) -> Node:
        if self._center is None:
            self._center = Node(target=self.target, term="center")
        return self._center

class LineNodes(Nodes):

    def __init__(self, target: Renderer) -> None:
        super().__init__(target)

class RectNodes(Nodes):

    def __init__(self, target: Renderer) -> None:
        super().__init__(target)

class SplineNodes(Nodes):

    def __init__(self, target: Renderer) -> None:
        super().__init__(target)

class WedgeNodes(Nodes):

    def __init__(self, target: Renderer) -> None:
        super().__init__(target)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
