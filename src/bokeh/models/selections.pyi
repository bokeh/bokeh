#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..model.model import JSEventCallback, Model, _ModelInit

class ImageIndex(TypedDict):
   index: int
   i: int
   j: int
   flat_index: int

# class _SelectionInit(_ModelInit, total=False):
#     indices: Sequence[int]
#     line_indices: Sequence[int]
#     multiline_indices: dict[int, Sequence[int]]
#     image_indices: list[ImageIndex]

class _SelectionInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    indices: Sequence[int]
    line_indices: Sequence[int]
    multiline_indices: dict[int, Sequence[int]]
    image_indices: list[ImageIndex]

class Selection(Model):
    def __init__(self, **kwargs: Unpack[_SelectionInit]) -> None: ...

    indices: Sequence[int] = ...
    line_indices: Sequence[int] = ...
    multiline_indices: dict[int, Sequence[int]] = ...
    image_indices: list[ImageIndex] = ...

# class _SelectionPolicyInit(_ModelInit, total=False):
#     ...

class _SelectionPolicyInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class SelectionPolicy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_SelectionPolicyInit]) -> None: ...

# class _IntersectRenderersInit(_SelectionPolicyInit, total=False):
#     ...

class _IntersectRenderersInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class IntersectRenderers(SelectionPolicy):
    def __init__(self, **kwargs: Unpack[_IntersectRenderersInit]) -> None: ...

# class _UnionRenderersInit(_SelectionPolicyInit, total=False):
#     ...

class _UnionRenderersInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class UnionRenderers(SelectionPolicy):
    def __init__(self, **kwargs: Unpack[_UnionRenderersInit]) -> None: ...
