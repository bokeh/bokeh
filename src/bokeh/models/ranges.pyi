#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from datetime import datetime as DateTime, timedelta as TimeDelta
from typing import (
    TYPE_CHECKING,
    Sequence,
    TypeAlias,
    overload,
)

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..core.enums import (
    AutoType as Auto,
    PaddingUnitsType as PaddingUnits,
    StartEndType as StartEnd,
)
from ..core.property.visual import Bounds, MinMaxBoundsType as MinMaxBounds
from ..model.model import Model, _ModelInit

Value: TypeAlias = float | DateTime | TimeDelta

Interval: TypeAlias = float | TimeDelta

MinMaxInterval: TypeAlias = Auto | Bounds[float] | Bounds[TimeDelta]

L1Factor: TypeAlias = str
L2Factor: TypeAlias = tuple[str, str]
L3Factor: TypeAlias = tuple[str, str, str]

Factor: TypeAlias = L1Factor | L2Factor | L3Factor
FactorSeq: TypeAlias = Sequence[L1Factor] | Sequence[L2Factor] | Sequence[L3Factor]

class _RangeInit(_ModelInit, total=False):
    ...

class Range(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_RangeInit]) -> None: ...

class _NumericalRangeInit(_RangeInit, total=False):
    start: Value
    end: Value

class NumericalRange(Range):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_NumericalRangeInit]) -> None: ...

    start: Value = ...
    end: Value = ...

class _Range1dInit(_NumericalRangeInit, total=False):
    reset_start: Value | None
    reset_end: Value | None
    bounds: MinMaxBounds | None
    min_interval: Interval | None
    max_interval: Interval | None

class Range1d(NumericalRange):
    @overload
    def __init__(self, start: Value, end: Value, /, **kwargs: Unpack[_Range1dInit]) -> None: ...
    @overload
    def __init__(self, **kwargs: Unpack[_Range1dInit]) -> None: ...

    reset_start: Value | None = ...
    reset_end: Value | None = ...
    bounds: MinMaxBounds | None = ...
    min_interval: Interval | None = ...
    max_interval: Interval | None = ...

class _DataRangeInit(_NumericalRangeInit, total=False):
    renderers: list[Model] | Auto | None

class DataRange(NumericalRange):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DataRangeInit]) -> None: ...

    renderers: list[Model] | Auto | None = ...

class _DataRange1dInit(_DataRangeInit, total=False):
    range_padding: Interval
    range_padding_units: PaddingUnits
    bounds: MinMaxBounds | None
    min_interval: Interval | None
    max_interval: Interval | None
    flipped: bool
    follow: StartEnd | None
    follow_interval: Interval | None
    default_span: Interval
    only_visible: bool

class DataRange1d(DataRange):
    def __init__(self, **kwargs: Unpack[_DataRange1dInit]) -> None: ...

    range_padding: Interval = ...
    range_padding_units: PaddingUnits = ...
    bounds: MinMaxBounds | None = ...
    min_interval: Interval | None = ...
    max_interval: Interval | None = ...
    flipped: bool = ...
    follow: StartEnd | None = ...
    follow_interval: Interval | None = ...
    default_span: Interval = ...
    only_visible: bool = ...

class _FactorRangeInit(_RangeInit, total=False):
    factors: FactorSeq
    factor_padding: float
    subgroup_padding: float
    group_padding: float
    range_padding: float
    range_padding_units: PaddingUnits
    bounds: MinMaxInterval | None
    min_interval: float | None
    max_interval: float | None

class FactorRange(Range):
    @overload
    def __init__(self, factors: FactorSeq, /, **kwargs: Unpack[_FactorRangeInit]) -> None: ...
    @overload
    def __init__(self, **kwargs: Unpack[_FactorRangeInit]) -> None: ...

    factors: FactorSeq = ...
    factor_padding: float = ...
    subgroup_padding: float = ...
    group_padding: float = ...
    range_padding: float = ...
    range_padding_units: PaddingUnits = ...
    bounds: MinMaxInterval | None = ...
    min_interval: float | None = ...
    max_interval: float | None = ...

    @property
    def start(self) -> float: ...
    @property
    def end(self) -> float: ...
