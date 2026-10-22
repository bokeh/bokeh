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

from typing import TYPE_CHECKING, Any

import numpy as np
import numpy.typing as npt

from ..core.has_props import abstract
from ..core.property.container import (
    Array,
    Dict,
    List,
    Seq,
)
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

def _indices(value: Any) -> npt.NDArray[np.int32]:
    values = np.asarray(value)
    if values.ndim == 1 and values.dtype == np.int32:
        return values
    if values.ndim != 1 or (values.size and values.dtype.kind not in "iu"):
        raise ValueError("selection indices must be one-dimensional int32 integers")
    if values.size and (np.any(values < -2147483648) or np.any(values > 2147483647)):
        raise ValueError("selection indices must be int32 integers")
    return np.asarray(values, dtype=np.int32)


class _SelectionIndices(Array[int]):
    def validate(self, value: Any, detail: bool = True) -> None:
        if not isinstance(value, np.ndarray):
            raise ValueError("expected a NumPy array")
        _indices(value)

    def transform(self, value: Any) -> npt.NDArray[np.int32]:
        return _indices(value)


class _MultilineIndices(Dict[int, Any]):
    def validate(self, value: Any, detail: bool = True) -> None:
        if not isinstance(value, dict):
            raise ValueError("expected a dictionary of index arrays")
        for key, values in value.items():
            self.keys_type.validate(key, detail)
            self.values_type.validate(values, detail)

    def transform(self, value: Any) -> dict[int, npt.NDArray[np.int32]]:
        return {key: _indices(values) for key, values in value.items()}


class Selection(Model):
    '''
    A Selection represents a portion of the data in a ``DataSource``, which
    can be visually manipulated in a plot.

    Selections are typically created by selecting points in a plot with
    a ``SelectTool``, but can also be programmatically specified.

    For most glyphs, the ``indices`` property is the relevant value to use.

    Index sequences are one-dimensional NumPy ``int32`` arrays in Python and
    ``Int32Array`` values in JavaScript. Assigning a list or another integer
    sequence converts it automatically. This also applies to ``line_indices``
    and each value in ``multiline_indices``. Assign a new sequence to change a
    selection; use ``indices.tolist()`` or ``Array.from(indices)`` when a list or ordinary
    JavaScript array is required.

    '''

    indices = _SelectionIndices(Int, default=[], help="""
    The "scatter" level indices included in a selection. For example, for a
    selection on a ``Circle`` glyph, this array records the indices of which
    individual circles are selected.

    For "multi" glyphs such as ``Patches``, ``MultiLine``, ``MultiPolygons``,
    etc, this array records the indices of which entire sub-items are selected.
    For example, which individual polygons of a ``MultiPolygon`` are selected.
    """).accepts(Seq(Int), _indices)

    line_indices = _SelectionIndices(Int, default=[], help="""
    The point indices included in a selection on a ``Line`` glyph.

    This value records the indices of the individual points on a ``Line`` that
    were selected by a selection tool.
    """).accepts(Seq(Int), _indices)

    multiline_indices = _MultilineIndices(Int, _SelectionIndices(Int), default={}, help="""
    The detailed point indices included in a selection on a ``MultiLine``.

    This value records which points, on which lines, are part of a selection
    on a ``MultiLine``. The keys are the top level indices (i.e. which line)
    which map to arrays of indices (i.e. which points on that line).

    If you only need to know which lines are selected, without knowing what
    individual points on those lines are selected, then you can look at the
    keys of this dictionary (converted to ints).
    """).accepts(Dict(Int, Seq(Int)), lambda value: {key: _indices(values) for key, values in value.items()})

    image_indices = List(Struct(index=Int, i=Int, j=Int, flat_index=Int), help="""

    """)

    def _serialize_property(self, name: str, value: Any, serializer: Serializer) -> Any:
        if name == "multiline_indices":
            return serializer.encode_typed_array_map({key: _indices(values) for key, values in value.items()})
        if name in ("indices", "line_indices"):
            value = _indices(value)
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
