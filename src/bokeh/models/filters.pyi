#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Any, Sequence

# Bokeh imports
from ..core.has_props import abstract
from ..model import Model

@abstract
@dataclass(init=False)
class Filter(Model):

    def __invert__(self) -> Filter: ...

    def __and__(self, other: Filter) -> Filter: ...

    def __or__(self, other: Filter) -> Filter: ...

    def __sub__(self, other: Filter) -> Filter: ...

    def __xor__(self, other: Filter) -> Filter: ...

@dataclass
class AllIndices(Filter):
    ...

@dataclass
class InversionFilter(Filter):

    operand: Filter = ...

@abstract
@dataclass(init=False)
class CompositeFilter(Filter):

    operands: Sequence[Filter] = ...

@dataclass
class IntersectionFilter(CompositeFilter):
    ...

@dataclass
class UnionFilter(CompositeFilter):
    ...

@dataclass
class DifferenceFilter(CompositeFilter):
    ...

@dataclass
class SymmetricDifferenceFilter(CompositeFilter):
    ...

@dataclass
class IndexFilter(Filter):

    indices: Sequence[int] | None = ...

@dataclass
class BooleanFilter(Filter):

    booleans: Sequence[bool] | None = ...

@dataclass
class GroupFilter(Filter):

    column_name: str = ...

    group: Any = ...

@dataclass
class CustomJSFilter(Filter):

    args: dict[str, Any] = ...

    code: str = ...
