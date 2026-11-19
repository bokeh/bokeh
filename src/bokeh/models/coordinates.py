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

# pyright: reportArgumentType=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from math import isfinite, pi
from numbers import Real

from ..core.enums import AngleUnits, Direction
from ..core.has_props import abstract
from ..core.property.enum import Enum
from ..core.property.instance import Instance, InstanceDefault
from ..core.property.numeric import NonNegative
from ..core.property.primitive import Float
from ..core.validation import error
from ..core.validation.errors import INVALID_PROPERTY_VALUE
from ..model import Model
from .ranges import DataRange1d, FactorRange, Range, Range1d
from .scales import CategoricalScale, LinearScale, Scale

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "CoordinateMapping",
    "SubplotMapping",
    "CartesianMapping",
    "PolarMapping",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class CoordinateMapping(Model):
    """A plot's data coordinate system.

    Cartesian and polar mappings share this interface. ``SubplotMapping``
    embeds a coordinate system within a Cartesian parent plot.
    """

    @property
    def ranges(self) -> tuple[Range, Range]:
        raise NotImplementedError


class CartesianMapping(CoordinateMapping):
    """Independent x and y ranges and scales for a Cartesian plot."""

    def __init__(self, *args, **kwargs) -> None:
        for dimension in ("x", "y"):
            if f"{dimension}_scale" not in kwargs and isinstance(kwargs.get(f"{dimension}_range"), FactorRange):
                kwargs[f"{dimension}_scale"] = CategoricalScale()
        super().__init__(*args, **kwargs)

    x_range = Instance(Range, default=InstanceDefault(DataRange1d), help="Horizontal data range.")
    y_range = Instance(Range, default=InstanceDefault(DataRange1d), help="Vertical data range.")
    x_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="Horizontal scale.")
    y_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="Vertical scale.")

    @property
    def ranges(self) -> tuple[Range, Range]:
        return self.x_range, self.y_range


class SubplotMapping(CoordinateMapping):
    """ A mapping between two coordinate systems. """

    @property
    def ranges(self) -> tuple[Range, Range]:
        return self.x_source, self.y_source

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

class PolarMapping(CoordinateMapping):
    """ Map radius and angle pairs into a circular plot frame.

    This implementation supports the glyphs described in :ref:`ug_topics_polar`
    and linear radial scaling. Radial and angular ranges must have finite, increasing bounds.
    Angular bounds describe an unwrapped sector of at most one revolution.
    """

    @property
    def ranges(self) -> tuple[Range, Range]:
        return self.radial_range, self.angular_range

    radial_range = Instance(Range1d, help="""
    Explicit radial limits. The lower limit must be nonnegative.
    """)

    angular_range = Instance(Range1d, default=InstanceDefault(Range1d, start=0, end=360), help="""
    Explicit angular limits in ``angle_units``. For a sector crossing zero,
    use unwrapped bounds such as 300 and 420.
    """)

    angle_units = Enum(AngleUnits, default="deg", help="""
    Units for input angles and angular range bounds.
    """)

    zero_direction = Enum("east", "north", "west", "south", default="east", help="""
    Direction of angle zero.
    """)

    direction = Enum(Direction, default="anticlock", help="""
    Direction of increasing angles.
    """)

    @error(INVALID_PROPERTY_VALUE)
    def _check_ranges(self) -> str | None:
        if self.lookup("radial_range").value_is_unset(self):
            return "PolarMapping requires an explicit radial_range"
        r, a = self.radial_range, self.angular_range
        values = (r.start, r.end, a.start, a.end)
        if not all(isinstance(value, Real) for value in values):
            return "PolarMapping range limits must be numeric"
        r0, r1, a0, a1 = (float(value) for value in values)
        period = dict(deg=360, rad=2*pi, grad=400, turn=1)[self.angle_units]
        if not all(isfinite(v) for v in (r0, r1, a0, a1)):
            return "PolarMapping range limits must be finite"
        if r0 < 0 or r1 <= r0:
            return "PolarMapping radial limits must be nonnegative and increasing"
        if not 0 < a1 - a0 <= period*(1 + 1e-10):
            return "PolarMapping angular limits must increase and span at most one revolution in angle_units. Set angular_range explicitly when changing angle_units"
        return None

    padding = NonNegative(Float, default=40, help="""
    Space in screen pixels reserved inside the frame for polar tick labels.
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
