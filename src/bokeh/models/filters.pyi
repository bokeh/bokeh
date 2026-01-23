#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Sequence, Unpack

# Bokeh imports
from ..model.model import Model, _ModelInit

class _FilterInit(_ModelInit, total=False):
    ...

class Filter(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_FilterInit]) -> None: ...

    def __invert__(self) -> Filter: ...
    def __and__(self, other: Filter) -> Filter: ...
    def __or__(self, other: Filter) -> Filter: ...
    def __sub__(self, other: Filter) -> Filter: ...
    def __xor__(self, other: Filter) -> Filter: ...

class _AllIndicesInit(_FilterInit, total=False):
    ...

class AllIndices(Filter):
    def __init__(self, **kwargs: Unpack[_AllIndicesInit]) -> None: ...

class _InversionFilterInit(_FilterInit, total=False):
    operand: Filter

class InversionFilter(Filter):
    def __init__(self, **kwargs: Unpack[_InversionFilterInit]) -> None: ...

    operand: Filter = ...

class _CompositeFilterInit(_FilterInit, total=False):
    operands: Sequence[Filter]

class CompositeFilter(Filter):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CompositeFilterInit]) -> None: ...

    operands: Sequence[Filter] = ...

class _IntersectionFilterInit(_CompositeFilterInit, total=False):
    ...

class IntersectionFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[_IntersectionFilterInit]) -> None: ...

class _UnionFilterInit(_CompositeFilterInit, total=False):
    ...

class UnionFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[_UnionFilterInit]) -> None: ...

class _DifferenceFilterInit(_CompositeFilterInit, total=False):
    ...

class DifferenceFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[_DifferenceFilterInit]) -> None: ...

class _SymmetricDifferenceFilterInit(_CompositeFilterInit, total=False):
    ...

class SymmetricDifferenceFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[_SymmetricDifferenceFilterInit]) -> None: ...

class _IndexFilterInit(_FilterInit, total=False):
    indices: Sequence[int] | None

class IndexFilter(Filter):
    def __init__(self, **kwargs: Unpack[_IndexFilterInit]) -> None: ...

    indices: Sequence[int] | None = ...

class _BooleanFilterInit(_FilterInit, total=False):
    booleans: Sequence[bool] | None

class BooleanFilter(Filter):
    def __init__(self, **kwargs: Unpack[_BooleanFilterInit]) -> None: ...

    booleans: Sequence[bool] | None = ...

class _GroupFilterInit(_FilterInit, total=False):
    column_name: str
    group: Any

class GroupFilter(Filter):
    def __init__(self, **kwargs: Unpack[_GroupFilterInit]) -> None: ...

    column_name: str = ...
    group: Any = ...

class _CustomJSFilterInit(_FilterInit, total=False):
    args: dict[str, Any]
    code: str

class CustomJSFilter(Filter):
    def __init__(self, **kwargs: Unpack[_CustomJSFilterInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...
