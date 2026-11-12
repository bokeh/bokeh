#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Auxiliary graphical models for aiding glyphs, guide renderers, etc.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from ..core.enums import AngleReference
from ..core.has_props import abstract
from ..core.property.container import List
from ..core.property.dataspec import AngleSpec, DataSpec, NumberSpec
from ..core.property.either import Either
from ..core.property.enum import Enum
from ..core.property.instance import Instance
from ..core.property.numeric import Percent
from ..core.property_aliases import AngleUnits
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Marking",
    "PathPlacement",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Marking(Model):
    """ Base class for graphical markings, e.g. arrow heads.

    """

    inherit_visuals = List(Enum(
        "line_color", "line_alpha", "line_width", "line_join", "line_cap",
        "line_dash", "line_dash_offset", "fill_color", "fill_alpha",
    ), default=[], help="""
    Visual properties to inherit from the active host glyph while rendering.
    Inherited fill color and alpha use the host's line color and alpha. Other
    inherited properties use the corresponding line property. Properties not
    listed here retain this marking's own values, allowing explicit overrides.
    The marking is not modified, so it can be shared by differently styled hosts.
    """)

class PathPlacement(Model):
    """Places a marking along a glyph's path."""

    marking = Instance(Marking, help="The graphical marking attached to the path.")

    positions = DataSpec(Either(Enum("start", "middle", "end"), List(Percent)), default=[0.5], help="""
    A named position or fractions of screen-space path length. Named start and
    end positions use endpoint tangents, honor inset, and trim the shaft.
    Middle and fractional positions use rear-to-tip chord alignment without
    inset or shaft trimming. Fractions 0 and 1 are not aliases for named endpoints.
    A field references a column of lists, one list per path. Empty lists skip
    a path. Visuals resolve per path.
    """)

    inset = NumberSpec(default=0, help="""
    The distance in screen pixels to move a named start or end marking inward.
    This can be a fixed value or a field in the glyph renderer's data source.
    """)

    angle = AngleSpec(default=0, help="""
    Counterclockwise rotation from the direction selected by angle_reference.
    A source field can supply a different angle for each path.
    """)

    angle_units = AngleUnits

    angle_reference = Enum(AngleReference, help="""
    The direction before applying angle. Auto uses the usual placement direction.
    Left and right use the normals to the forward screen-space tangent.
    Screen points up.
    """)
