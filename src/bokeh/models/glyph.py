#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Display a variety of visual shapes whose attributes can be associated
with data columns from ``ColumnDataSources``.

All these glyphs share a minimal common interface through their base class
``Glyph``:

.. autoclass:: Glyph
    :members:

'''

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

# Bokeh imports
from ..core.has_props import HasProps, abstract
from ..core.property.container import List
from ..core.property.instance import Instance
from ..model import Model
from .graphics import Decoration

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ConnectedXYGlyph',
    'FillGlyph',
    'Glyph',
    'HatchGlyph',
    'LineGlyph',
    'RadialGlyph',
    'TextGlyph',
    'XYGlyph',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Glyph(Model):
    ''' Base class for all glyph models.

    '''

    def _supports_path_decorations(self, placement: str | float) -> bool:
        return False

    decorations = List(Instance(Decoration), default=[], help="""
    A collection of glyph decorations, e.g. arrow heads.

    Use ``GlyphRenderer.add_path_decoration()`` or
    ``GlyphRenderer.add_path_markings()`` to configure supported path glyphs
    and their renderer states. Use this property when finer control is needed.
    Path markings participate in hit testing and select their host glyph item.
    """)

@abstract
class XYGlyph(Glyph):
    ''' Base class of glyphs with `x` and `y` coordinate attributes.

    '''

@abstract
class RadialGlyph(XYGlyph):
    ''' Base class of glyphs with `x` and `y` coordinate attributes and
    a radius specification.

    '''

@abstract
class ConnectedXYGlyph(XYGlyph):
    ''' Base class of glyphs with `x` and `y` coordinate attributes and
    a connected topology.

    '''

@abstract
class LineGlyph(HasProps):
    ''' Glyphs with line properties

    '''

@abstract
class FillGlyph(HasProps):
    ''' Glyphs with fill properties

    '''

@abstract
class TextGlyph(HasProps):
    ''' Glyphs with text properties

    '''

@abstract
class HatchGlyph(HasProps):
    ''' Glyphs with Hatch properties

    '''

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
