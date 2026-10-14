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

# Standard library imports

# Bokeh imports
from ..core.has_props import abstract
from ..core.property.container import List
from ..core.property.dataspec import DataSpec, NumberSpec
from ..core.property.enum import Enum
from ..core.property.instance import Instance
from ..core.property.numeric import Percent
from ..core.property.required import Required
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Decoration",
    "Marking",
    "PathDecoration",
    "PathMarkings",
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

@abstract
class Decoration(Model):
    """ Base class for auxiliary graphical effects attached to a glyph.

    """


class PathDecoration(Decoration):
    """A marking attached to a named path node."""

    marking = Instance(Marking, help="""The graphical marking attached to the path node.""")

    node = Required(Enum("start", "middle", "end"), help="""
    The named node. Start and end use endpoint tangents, honor inset, and trim
    the shaft. Middle places one marking at half the screen-space path length
    with rear-to-tip chord alignment, without inset or shaft trimming.
    """)

    inset = NumberSpec(default=0, help="""
    The distance in screen pixels to move a start or end marking inward.
    This can be a fixed value or a field in the glyph renderer's data source.
    """)


class PathMarkings(Decoration):
    """Repeated fractional markings along each path."""

    marking = Instance(Marking, help="""The graphical marking repeated along each path.""")

    positions = DataSpec(List(Percent), default=[0.5], help="""
    Fractions of screen-space path length. A literal list applies to every path.
    A field references a column of lists, one list per path. Empty lists draw no
    markings. Each marking points along a rear-to-tip chord within its finite
    subpath, without inset or shaft trimming. Fractions 0 and 1 retain this
    behavior and are not aliases for named endpoints. Visuals resolve per path.
    """)
