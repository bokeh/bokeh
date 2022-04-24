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
from ..core.enums import AngleUnits, CoordinateUnits
from ..core.has_props import abstract
from ..core.properties import (
    Angle,
    Auto,
    Either,
    Enum,
    Float,
    Instance,
    InstanceDefault,
    NonNullable as Required,
    String,
)
from ..model import Model
from .ranges import DataRange1d, Range
from .scales import LinearScale, Scale

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Coordinate",
    "CoordinateMapping",
    "Node",
    "Polar",
    "XY",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Coordinate(Model):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class XY(Coordinate):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    x = Required(Float)
    y = Required(Float)

    x_units = Enum(CoordinateUnits, default="data")
    y_units = Enum(CoordinateUnits, default="data")

class Polar(Coordinate):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    radius = Required(Float)

    angle = Required(Angle)
    angle_units = Enum(AngleUnits, default="rad")

class Node(Coordinate):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    target = Required(Instance(Model)) # needs a base model or a trait
    term = Required(String)

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

    x_target = Either(Auto, Instance(Range), default="auto", help="""
    The horizontal range to map x-coordinates in the target coordinate space.
    """)

    y_target = Either(Auto, Instance(Range), default="auto", help="""
    The vertical range to map y-coordinates in the target coordinate space.
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
