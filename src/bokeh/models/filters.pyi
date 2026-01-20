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
from ..model.model import Model, ModelInit

class FilterInit(ModelInit, total=False):
    ...

class Filter(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[FilterInit]) -> None: ...

    def __invert__(self) -> Filter: ...
    def __and__(self, other: Filter) -> Filter: ...
    def __or__(self, other: Filter) -> Filter: ...
    def __sub__(self, other: Filter) -> Filter: ...
    def __xor__(self, other: Filter) -> Filter: ...

class AllIndicesInit(FilterInit, total=False):
    ...

class AllIndices(Filter):
    def __init__(self, **kwargs: Unpack[AllIndicesInit]) -> None: ...

class InversionFilterInit(FilterInit, total=False):
    operand: Filter

class InversionFilter(Filter):
    def __init__(self, **kwargs: Unpack[InversionFilterInit]) -> None: ...

    operand: Filter = ...

class CompositeFilterInit(FilterInit, total=False):
    operands: Sequence[Filter]

class CompositeFilter(Filter):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[CompositeFilterInit]) -> None: ...

    operands: Sequence[Filter] = ...

class IntersectionFilterInit(CompositeFilterInit, total=False):
    ...

class IntersectionFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[IntersectionFilterInit]) -> None: ...

class UnionFilterInit(CompositeFilterInit, total=False):
    ...

class UnionFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[UnionFilterInit]) -> None: ...

class DifferenceFilterInit(CompositeFilterInit, total=False):
    ...

class DifferenceFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[DifferenceFilterInit]) -> None: ...

class SymmetricDifferenceFilterInit(CompositeFilterInit, total=False):
    ...

class SymmetricDifferenceFilter(CompositeFilter):
    def __init__(self, **kwargs: Unpack[SymmetricDifferenceFilterInit]) -> None: ...

class IndexFilterInit(FilterInit, total=False):
    indices: Sequence[int] | None

class IndexFilter(Filter):
    def __init__(self, **kwargs: Unpack[IndexFilterInit]) -> None: ...

    indices: Sequence[int] | None = ...

class BooleanFilterInit(FilterInit, total=False):
    booleans: Sequence[bool] | None

class BooleanFilter(Filter):
    def __init__(self, **kwargs: Unpack[BooleanFilterInit]) -> None: ...

    booleans: Sequence[bool] | None = ...

class GroupFilterInit(FilterInit, total=False):
    column_name: str
    group: Any

class GroupFilter(Filter):
    def __init__(self, **kwargs: Unpack[GroupFilterInit]) -> None: ...

    column_name: str = ...
    group: Any = ...

class CustomJSFilterInit(FilterInit, total=False):
    args: dict[str, Any]
    code: str

class CustomJSFilter(Filter):
    def __init__(self, **kwargs: Unpack[CustomJSFilterInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...
