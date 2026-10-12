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
from typing import Any

# Bokeh imports
from ..core.has_props import abstract
from ..core.property.container import List
from ..core.property.dataspec import NumberSpec
from ..core.property.enum import Enum
from ..core.property.instance import Instance
from ..core.property.required import Required
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Decoration",
    "Marking",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Marking(Model):
    """ Base class for graphical markings, e.g. arrow heads.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

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

class Decoration(Model):
    """ Indicates a positioned marker, e.g. at a node of a glyph.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    marking = Instance(Marking, help="""
    The graphical marking associated with this decoration, e.g. an arrow head.
    """)

    node = Required(Enum("start", "middle", "end"), help="""
    The placement of the marking on the parent graphical object.
    """)

    inset = NumberSpec(default=0, help="""
    The distance in screen pixels to move a start or end marking inward along
    the parent graphical object. The parent glyph's line stops at the marking's
    rear extent instead of continuing underneath it. This can be a fixed value
    or a field in the glyph renderer's data source.
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
