#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from datetime import datetime as DateTime, timedelta as TimeDelta
from typing import Sequence

# Bokeh imports
from .._types import Readonly
from ..core.enums import (
    AutoType as Auto,
    PaddingUnitsType as PaddingUnits,
    StartEndType as StartEnd,
)
from ..core.has_props import abstract
from ..model import Model

type Value = float | DateTime | TimeDelta

type Interval = float | TimeDelta

type Bounds[T] = tuple[T, T] | tuple[T | None, T] | tuple[T, T | None]

type MinMaxBounds = Auto | Bounds[float] | Bounds[DateTime] | Bounds[TimeDelta]
type MinMaxInterval = Auto | Bounds[float] | Bounds[TimeDelta]

type L1Factor = str
type L2Factor = tuple[str, str]
type L3Factor = tuple[str, str, str]

type Factor = L1Factor | L2Factor | L3Factor
type FactorSeq = Sequence[L1Factor] | Sequence[L2Factor] | Sequence[L3Factor]

@abstract
@dataclass(init=False)
class Range(Model):
    ...

@abstract
@dataclass(init=False)
class NumericalRange(Range):

    start: Value = ...

    end: Value = ...

@dataclass
class Range1d(NumericalRange):

    def __init__(self, start: Value, end: Value) -> None: ...

    reset_start: Value | None = ...

    reset_end: Value | None = ...

    bounds: MinMaxBounds | None = ...

    min_interval: Interval | None = ...

    max_interval: Interval | None = ...

@abstract
@dataclass(init=False)
class DataRange(NumericalRange):

    renderers: list[Model] | Auto | None = ...

@dataclass
class DataRange1d(DataRange):

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

@dataclass
class FactorRange(Range):

    def __init__(self, factors: FactorSeq) -> None: ...

    factors: FactorSeq = ...

    factor_padding: float = ...

    subgroup_padding: float = ...

    group_padding: float = ...

    range_padding: float = ...

    range_padding_units: PaddingUnits = ...

    start: Readonly[float] = ...

    end: Readonly[float] = ...

    bounds: MinMaxInterval | None = ...

    min_interval: float | None = ...

    max_interval: float | None = ...
