#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various scalar geometric shapes.

    .. warning::
        This module and all public models and other APIs it exports are
        experimental and may changed or get removed at any point in time.
"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.enums import (
    AngleUnits,
    Direction,
    MarkerType,
    RadiusDimension,
)
from ..core.has_props import HasProps, Qualified, abstract
from ..core.properties import (
    Angle,
    Bool,
    Enum,
    Float,
    Include,
    Instance,
    InstanceDefault,
    List,
    NonNegative,
    Nullable,
    Override,
    Seq,
    String,
)
from ..core.property_aliases import (
    Anchor,
    BorderRadius,
    Padding,
    TextAnchor,
)
from ..core.property_mixins import (
    ScalarFillProps,
    ScalarHatchProps,
    ScalarLineProps,
    ScalarTextProps,
)
from .coordinates import XY, Coordinate
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
    "Label",
    "Marker",
    "Segment",
    "Spline",
    "Wedge",
    "NormalHead",
    "OpenHead",
    "TeeHead",
    "VeeHead",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Shape(Renderer, Qualified):
    """ """

    __view_module__ = "bokeh.models.shapes"

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    level = Override(default="overlay")

@abstract
class Path(HasProps, Qualified):
    """ """

    line_props = Include(ScalarLineProps)

@abstract
class Area(HasProps, Qualified):
    """ """

    fill_props = Include(ScalarFillProps)
    hatch_props = Include(ScalarHatchProps)

@abstract
class Text(HasProps, Qualified):
    """ """

    text_props = Include(ScalarTextProps)

class AnnularWedge(Shape, Path, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xy = Instance(Coordinate, default=InstanceDefault(XY))
    inner_radius = NonNegative(Float, default=0)
    outer_radius = NonNegative(Float, default=0)
    radius_dimension = Enum(RadiusDimension, default="x")
    start_angle = Angle(default=0)
    end_angle = Angle(default=0)
    angle_units = Enum(AngleUnits, default="rad")
    direction = Enum(Direction, default="anticlock")

class Annulus(Shape, Path, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xy = Instance(Coordinate, default=InstanceDefault(XY))
    inner_radius = NonNegative(Float, default=0)
    outer_radius = NonNegative(Float, default=0)
    radius_dimension = Enum(RadiusDimension, default="x")

class Arc(Shape, Path):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xy = Instance(Coordinate, default=InstanceDefault(XY))
    radius = NonNegative(Float, default=0)
    radius_dimension = Enum(RadiusDimension, default="x")
    start_angle = Angle(default=0)
    end_angle = Angle(default=0)
    angle_units = Enum(AngleUnits, default="rad")
    direction = Enum(Direction, default="anticlock")
    decorations = List(Instance(Decoration), default=[])

class Bezier(Shape, Path):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xy0 = Instance(Coordinate, default=InstanceDefault(XY))
    xy1 = Instance(Coordinate, default=InstanceDefault(XY))
    cxy0 = Instance(Coordinate, default=InstanceDefault(XY))
    cxy1 = Nullable(Instance(Coordinate), default=None)

class Box(Shape, Path, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xy = Instance(Coordinate, default=InstanceDefault(XY))
    width = NonNegative(Float, default=0)
    height = NonNegative(Float, default=0)
    anchor = Anchor(default="center")

class Circle(Shape, Path, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xy = Instance(Coordinate, default=InstanceDefault(XY))
    radius = NonNegative(Float, default=0)
    radius_dimension = Enum(RadiusDimension, default="x")

class Label(Shape, Path, Area, Text):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xy = Instance(Coordinate, default=InstanceDefault(XY))
    width = Nullable(NonNegative(Float), default=None)
    height = Nullable(NonNegative(Float), default=None)
    anchor = TextAnchor(default="auto")
    text = String(default="")
    angle = Angle(default=0)
    angle_units = Enum(AngleUnits, default="rad")
    direction = Enum(Direction, default="anticlock")
    padding = Padding(default=0)
    border_radius = BorderRadius(default=0)

class Marker(Shape, Path, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xy = Instance(Coordinate, default=InstanceDefault(XY))
    size = NonNegative(Float, default=5)
    angle = Angle(default=0)
    angle_units = Enum(AngleUnits, default="rad")
    direction = Enum(Direction, default="anticlock")
    marker = Enum(MarkerType, default="circle")

class Segment(Shape, Path):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xy0 = Instance(Coordinate, default=InstanceDefault(XY))
    xy1 = Instance(Coordinate, default=InstanceDefault(XY))

class Spline(Shape, Path):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xs = Seq(Float, default=[])
    ys = Seq(Float, default=[])
    tension = Float(default=0.5)
    closed = Bool(default=False)

class Wedge(Shape, Path, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xy = Instance(Coordinate, default=InstanceDefault(XY))
    radius = NonNegative(Float, default=0)
    radius_dimension = Enum(RadiusDimension, default="x")
    start_angle = Angle(default=0)
    end_angle = Angle(default=0)
    angle_units = Enum(AngleUnits, default="rad")
    direction = Enum(Direction, default="anticlock")

@abstract
class ArrowHead(Shape):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    size = Float(default=25)

class OpenHead(ArrowHead, Path):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class NormalHead(ArrowHead, Path, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    fill_color = Override(default="black")

class VeeHead(ArrowHead, Path, Area):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    fill_color = Override(default="black")

class TeeHead(ArrowHead, Path):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
