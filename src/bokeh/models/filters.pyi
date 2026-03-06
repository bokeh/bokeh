#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Any, Sequence, TypedDict

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..model.model import JSEventCallback, Model, _ModelInit

# class _FilterInit(_ModelInit, total=False):
#     ...

class _FilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class Filter(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_FilterInit]) -> None: ...

    def __invert__(self) -> Filter: ...
    def __and__(self, other: Filter) -> Filter: ...
    def __or__(self, other: Filter) -> Filter: ...
    def __sub__(self, other: Filter) -> Filter: ...
    def __xor__(self, other: Filter) -> Filter: ...

# class _AllIndicesInit(_FilterInit, total=False):
#     ...

class _AllIndicesInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class AllIndices(Filter):
    def __init__(self, **kwargs: Unpack[_AllIndicesInit]) -> None: ...

# class _InversionFilterInit(_FilterInit, total=False):
#     operand: Filter

class _InversionFilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    operand: Filter

class InversionFilter(Filter):
    def __init__(self, **kwargs: Unpack[_InversionFilterInit]) -> None: ...

    operand: Filter = ...

# class _CompositeFilterInit(_FilterInit, total=False):
#     operands: Sequence[Filter]

class _CompositeFilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    operands: Sequence[Filter]

class CompositeFilter(Filter):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CompositeFilterInit]) -> None: ...

    operands: Sequence[Filter] = ...

# class _IntersectionFilterInit(_CompositeFilterInit, total=False):
#     ...

class _IntersectionFilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    operands: Sequence[Filter]

class IntersectionFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[_IntersectionFilterInit]) -> None: ...

# class _UnionFilterInit(_CompositeFilterInit, total=False):
#     ...

class _UnionFilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    operands: Sequence[Filter]

class UnionFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[_UnionFilterInit]) -> None: ...

# class _DifferenceFilterInit(_CompositeFilterInit, total=False):
#     ...

class _DifferenceFilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    operands: Sequence[Filter]

class DifferenceFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[_DifferenceFilterInit]) -> None: ...

# class _SymmetricDifferenceFilterInit(_CompositeFilterInit, total=False):
#     ...

class _SymmetricDifferenceFilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    operands: Sequence[Filter]

class SymmetricDifferenceFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[_SymmetricDifferenceFilterInit]) -> None: ...

# class _IndexFilterInit(_FilterInit, total=False):
#     indices: Sequence[int] | None

class _IndexFilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    indices: Sequence[int] | None

class IndexFilter(Filter):
    def __init__(self, **kwargs: Unpack[_IndexFilterInit]) -> None: ...

    indices: Sequence[int] | None = ...

# class _BooleanFilterInit(_FilterInit, total=False):
#     booleans: Sequence[bool] | None

class _BooleanFilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    booleans: Sequence[bool] | None

class BooleanFilter(Filter):
    def __init__(self, **kwargs: Unpack[_BooleanFilterInit]) -> None: ...

    booleans: Sequence[bool] | None = ...

# class _GroupFilterInit(_FilterInit, total=False):
#     column_name: str
#     group: Any

class _GroupFilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    column_name: str
    group: Any

class GroupFilter(Filter):
    def __init__(self, **kwargs: Unpack[_GroupFilterInit]) -> None: ...

    column_name: str = ...
    group: Any = ...

# class _CustomJSFilterInit(_FilterInit, total=False):
#     args: dict[str, Any]
#     code: str

class _CustomJSFilterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    args: dict[str, Any]
    code: str

class CustomJSFilter(Filter):
    def __init__(self, **kwargs: Unpack[_CustomJSFilterInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...
