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

# Standard library imports
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ..core.has_props import abstract
from ..core.property.container import Dict, List, Seq
from ..core.property.primitive import Int
from ..core.property.struct import Struct
from ..model import Model

if TYPE_CHECKING:
    from ..core.serialization import Serializer

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

    In Python, index sequences received from BokehJS may be compact integer arrays
    (``array.array``) rather than lists. Use ``list(selection.indices)`` when
    a list is required. The same applies to ``line_indices`` and the values
    in ``multiline_indices``.

    In JavaScript, these sequences may be ordinary arrays or typed arrays.
    Selections received from another client or loaded from a server document
    can use ``Int32Array``, even when the selecting browser retains ordinary
    arrays. Use ``Array.from(selection.indices)`` before calling array-only
    methods such as ``push`` or ``concat``, or when JSON output must be a list.

    A change in sequence type can trigger a callback even when the indices
    have the same numerical values. Normalize the sequences before comparing
    their contents when the callback needs to ignore such changes.

    '''

    indices = Seq(Int, default=[], help="""
    The "scatter" level indices included in a selection. For example, for a
    selection on a ``Circle`` glyph, this list records the indices of which
    individual circles are selected.

    For "multi" glyphs such as ``Patches``, ``MultiLine``, ``MultiPolygons``,
    etc, this list records the indices of which entire sub-items are selected.
    For example, which individual polygons of a ``MultiPolygon`` are selected.
    """)

    line_indices = Seq(Int, default=[], help="""
    The point indices included in a selection on a ``Line`` glyph.

    This value records the indices of the individual points on a ``Line`` that
    were selected by a selection tool.
    """)

    multiline_indices = Dict(Int, Seq(Int), default={}, help="""
    The detailed point indices included in a selection on a ``MultiLine``.

    This value records which points, on which lines, are part of a selection
    on a ``MultiLine``. The keys are the top level indices (i.e. which line)
    which map to lists of indices (i.e. which points on that line).

    If you only need to know which lines are selected, without knowing what
    individual points on those lines are selected, then you can look at the
    keys of this dictionary (converted to ints).
    """)

    image_indices = List(Struct(index=Int, i=Int, j=Int, flat_index=Int), help="""

    """)

    def _serialize_property(self, name: str, value: Any, serializer: Serializer) -> Any:
        if name == "multiline_indices":
            return serializer.encode_typed_array_map(value)
        return super()._serialize_property(name, value, serializer)

@abstract
class SelectionPolicy(Model):
    '''

    '''


class IntersectRenderers(SelectionPolicy):
    '''
    When a data source is shared between multiple renderers, a row in the data
    source will only be selected if that point for each renderer is selected. The
    selection is made from the intersection of hit test results from all renderers.

    '''


class UnionRenderers(SelectionPolicy):
    '''
    When a data source is shared between multiple renderers, selecting a point on
    from any renderer will cause that row in the data source to be selected. The
    selection is made from the union of hit test results from all renderers.

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
