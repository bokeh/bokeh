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
from typing import Any

# Bokeh imports
from ..core.has_props import HasProps, abstract
from ..core.properties import Instance, List
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

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    decorations = List(Instance(Decoration), default=[], help="""
    A collection of glyph decorations, e.g. arrow heads.

    Use ``GlyphRenderer.add_decoration()`` for easy setup for all glyphs
    of a glyph renderer. Use this property when finer control is needed.

    .. note::

        Decorations are only for aiding visual appearance of a glyph,
        but they don't participate in hit testing, etc.
    """)

@abstract
class XYGlyph(Glyph):
    ''' Base class of glyphs with `x` and `y` coordinate attributes.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

@abstract
class RadialGlyph(XYGlyph):
    ''' Base class of glyphs with `x` and `y` coordinate attributes and
    a radius specification.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

@abstract
class ConnectedXYGlyph(XYGlyph):
    ''' Base class of glyphs with `x` and `y` coordinate attributes and
    a connected topology.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

@abstract
class LineGlyph(HasProps):
    ''' Glyphs with line properties

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

@abstract
class FillGlyph(HasProps):
    ''' Glyphs with fill properties

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

@abstract
class TextGlyph(HasProps):
    ''' Glyphs with text properties

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

@abstract
class HatchGlyph(HasProps):
    ''' Glyphs with Hatch properties

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
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
