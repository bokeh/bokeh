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

from typing import TYPE_CHECKING, Any, cast

import numpy as np

from ..core.has_props import abstract
from ..core.property.container import Dict, List
from ..core.property.primitive import Int
from ..core.property.struct import Struct
from ..core.property.wrappers import PropertyValueDict
from ..model import Model
from ._selection import SelectionPayload, normalize, validate

if TYPE_CHECKING:
    from ..core.has_props import HasProps, Setter
    from ..core.serialization import ObjectRep, Serializer
    from ..document import Document
    from ..document.events import DocumentPatchedEvent, Invoker, ModelChangedEvent

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

class _SelectionIndices(List[int]):
    def prepare_value(self, owner: HasProps | type[HasProps], name: str, value: Any, *,
            hint: DocumentPatchedEvent | None = None) -> list[int]:
        try:
            value = normalize(value)
        except ValueError:
            # Let the base property attach owner/property context to the error.
            pass
        return super().prepare_value(owner, name, value, hint=hint)

    def validate(self, value: Any, detail: bool = True) -> None:
        validate(value)

    def transform(self, value: Any) -> list[int]:
        return normalize(value)


def _multiline_key(key: Any) -> int:
    if not isinstance(key, (int, np.integer)) or isinstance(key, (bool, np.bool_)) or not 0 <= key <= 2147483647:
        raise ValueError("multiline keys must be nonnegative int32 integers")
    return int(key)


class _MultilineMap(PropertyValueDict[list[int]]):
    """ Distinguish selection maps from other observed dictionary inputs. """


class _MultilineIndices(Dict[int, list[int]]):
    def prepare_value(self, owner: HasProps | type[HasProps], name: str, value: Any, *,
            hint: DocumentPatchedEvent | None = None) -> dict[int, list[int]]:
        if isinstance(value, dict):
            try:
                value = self.transform(value)
            except (ValueError, TypeError):
                pass
        return super().prepare_value(owner, name, value, hint=hint)

    def validate(self, value: Any, detail: bool = True) -> None:
        if not isinstance(value, dict):
            raise ValueError("expected a dictionary of index lists")
        for key, values in value.items():
            _multiline_key(key)
            validate(values)

    def transform(self, value: Any) -> dict[int, list[int]]:
        items = [(_multiline_key(key), normalize(values)) for key, values in sorted(value.items())]
        if not isinstance(value, _MultilineMap):
            value = _MultilineMap()
        # Keep the selection mapping and its owners when normalizing a mutation.
        dict.clear(value)
        dict.update(value, items)
        return cast(dict[int, list[int]], value)


class Selection(Model):
    '''
    A Selection represents a portion of the data in a ``DataSource``, which
    can be visually manipulated in a plot.

    Selections are typically created by selecting points in a plot with
    a ``SelectTool``, but can also be programmatically specified.

    For most glyphs, the ``indices`` property is the relevant value to use.

    Index sequences are Python lists and JavaScript arrays of nonnegative int32
    indices. They represent sets: duplicates are removed and order is not
    significant. Values are stored in ascending order. This applies to
    ``indices``, ``line_indices``, and values in ``multiline_indices``.
    Python supports in-place updates to ``indices``, ``line_indices``, and the
    ``multiline_indices`` dictionary. Replace a dictionary value to update that
    row. In JavaScript, assign a new array to trigger a change.

    '''

    indices = _SelectionIndices(Int, default=[], help="""
    The "scatter" level indices included in a selection. For example, for a
    selection on a ``Circle`` glyph, this array records the indices of which
    individual circles are selected.

    For "multi" glyphs such as ``Patches``, ``MultiLine``, ``MultiPolygons``,
    etc, this array records the indices of which entire sub-items are selected.
    For example, which individual polygons of a ``MultiPolygon`` are selected.
    """)

    line_indices = _SelectionIndices(Int, default=[], help="""
    The point indices included in a selection on a ``Line`` glyph.

    This value records the indices of the individual points on a ``Line`` that
    were selected by a selection tool.
    """)

    multiline_indices = _MultilineIndices(Int, _SelectionIndices(Int), default={}, help="""
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

    def to_serializable(self, serializer: Serializer) -> ObjectRep:
        return self._to_serializable(serializer, {
            "indices": SelectionPayload(self.indices),
            "line_indices": SelectionPayload(self.line_indices),
            "multiline_indices": SelectionPayload(self.multiline_indices, multiline=True),
        })

    def _create_model_changed_event(self, document: Document, attr: str, new: Any,
            setter: Setter | None = None, callback_invoker: Invoker | None = None) -> ModelChangedEvent:
        event = super()._create_model_changed_event(document, attr, new, setter, callback_invoker)
        if attr in ("indices", "line_indices", "multiline_indices"):
            event._representation = SelectionPayload(new, multiline=attr == "multiline_indices")
        return event

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
