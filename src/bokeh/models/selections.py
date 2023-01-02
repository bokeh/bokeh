#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from ..core.has_props import abstract
from ..core.properties import (
    Dict,
    Int,
    List,
    Seq,
    String,
    Struct,
)
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'IntersectRenderers',
    'Selection',
    'SelectionPolicy',
    'UnionRenderers',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Selection(Model):
    '''
    A Selection represents a portion of the data in a ``DataSource``, which
    can be visually manipulated in a plot.

    Selections are typically created by selecting points in a plot with
    a ``SelectTool``, but can also be programmatically specified.

    For most glyphs, the ``indices`` property is the relevant value to use.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    indices = Seq(Int, default=[], help="""
    The "scatter" level indices included in a selection. For example, for a
    selection on a ``Circle`` glyph, this list records the indices of which
    individual circles are selected.

    For "multi" glyphs such as ``Patches``, ``MultiLine``, ``MultiPolygons``,
    etc, this list records the indices of which entire sub-items are selected.
    For example, which indidual polygons of a ``MultiPolygon`` are selected.
    """)

    line_indices = Seq(Int, default=[], help="""
    The point indices included in a selection on a ``Line`` glyph.

    This value records the indices of the individual points on a ``Line`` that
    were selected by a selection tool.
    """)

    multiline_indices = Dict(String, Seq(Int), default={}, help="""
    The detailed point indices included in a selection on a ``MultiLine``.

    This value records which points, on which lines, are part of a seletion on
    a ``MulitLine``. The keys are the top level indices (i.e., which line)
    which map to lists of indices (i.e. which points on that line).

    If you only need to know which lines are selected, without knowing what
    individual points on those lines are selected, then you can look at the
    keys of this dictionary (converted to ints).
    """)

    image_indices = List(Struct(index=Int, i=Int, j=Int, flat_index=Int), help="""

    """)

@abstract
class SelectionPolicy(Model):
    '''

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class IntersectRenderers(SelectionPolicy):
    '''
    When a data source is shared between multiple renderers, a row in the data
    source will only be selected if that point for each renderer is selected. The
    selection is made from the intersection of hit test results from all renderers.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class UnionRenderers(SelectionPolicy):
    '''
    When a data source is shared between multiple renderers, selecting a point on
    from any renderer will cause that row in the data source to be selected. The
    selection is made from the union of hit test results from all renderers.

    '''

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
