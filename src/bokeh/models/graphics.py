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

class Decoration(Model):
    """ Indicates a positioned marker, e.g. at a node of a glyph.

    """

    marking = Instance(Marking, help="""
    The graphical marking associated with this decoration, e.g. an arrow head.
    """)

    node = Required(Enum("start", "middle", "end"), help="""
    The placement of the marking on the parent graphical object.
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
