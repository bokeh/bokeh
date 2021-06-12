#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    List,
    Union,
)

# External imports
from typing_extensions import Literal, TypedDict

## Bokeh imports
if TYPE_CHECKING:
    from ..core.has_props import ModelDef
    from ..core.types import ID, Unknown
    from ..model import Ref, ReferenceJson
    from ..models.sources import DataDict

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

Patch = Any # TODO

Patches = Dict[str, List[Patch]]

class ModelChanged(TypedDict):
    kind: Literal["ModelChanged"]
    model: Ref
    attr: str
    new: Unknown
    hint: DocumentPatched | None

class MessageSent(TypedDict):
    kind: Literal["MessageSent"]
    msg_type: str
    msg_data: Unknown | None

class TitleChanged(TypedDict):
    kind: Literal["TitleChanged"]
    title: str

class RootAdded(TypedDict):
    kind: Literal["RootAdded"]
    model: Ref

class RootRemoved(TypedDict):
    kind: Literal["RootRemoved"]
    model: Ref

class ColumnDataChanged(TypedDict):
    kind: Literal["ColumnDataChanged"]
    column_source: Ref
    cols: List[str] | None
    new: Unknown

class ColumnsStreamed(TypedDict):
    kind: Literal["ColumnsStreamed"]
    column_source: Ref
    data: DataDict
    rollover: int | None

class ColumnsPatched(TypedDict):
    kind: Literal["ColumnsPatched"]
    column_source: Ref
    patches: Patches

DocumentPatched = Union[
    MessageSent,
    ModelChanged,
    ColumnDataChanged,
    ColumnsStreamed,
    ColumnsPatched,
    TitleChanged,
    RootAdded,
    RootRemoved,
]

DocumentChanged = DocumentPatched

class RootsJson(TypedDict):
    root_ids: List[ID]
    references: List[ReferenceJson]

class DocJson(TypedDict):
    version: str | None
    title: str | None
    defs: List[ModelDef] | None
    roots: RootsJson

class PatchJson(TypedDict):
    events: List[DocumentChanged]
    references: List[ReferenceJson]

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
