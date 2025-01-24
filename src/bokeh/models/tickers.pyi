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
from ..core.enums import AutoType as Auto, LatLonType as LatLon
from ..core.has_props import abstract
from ..model import Model
from .mappers import ScanningColorMapper

@abstract
@dataclass(init=False)
class Ticker(Model):
    ...

@dataclass
class CustomJSTicker(Ticker):

    args: dict[str, Any] = ...

    major_code: str = ...

    minor_code: str = ...

@abstract
@dataclass(init=False)
class ContinuousTicker(Ticker):

    num_minor_ticks: int = ...

    desired_num_ticks: int = ...

@dataclass
class FixedTicker(ContinuousTicker):

    ticks: Sequence[float] = ...

    minor_ticks: Sequence[float] = ...

@dataclass
class AdaptiveTicker(ContinuousTicker):

    base: float = ...

    mantissas: Sequence[float] = ...

    min_interval: float = ...

    max_interval: float | None = ...

@dataclass
class CompositeTicker(ContinuousTicker):

    tickers: Sequence[Ticker] = ...

@dataclass
class BaseSingleIntervalTicker(ContinuousTicker):
    ...

@dataclass
class SingleIntervalTicker(BaseSingleIntervalTicker):

    interval: float = ...

@dataclass
class DaysTicker(BaseSingleIntervalTicker):

    days: Sequence[int] = ...

@dataclass
class MonthsTicker(BaseSingleIntervalTicker):

    months: Sequence[int] = ...

@dataclass
class YearsTicker(BaseSingleIntervalTicker):
    ...

@dataclass
class BasicTicker(AdaptiveTicker):
    ...

@dataclass
class LogTicker(AdaptiveTicker):
    ...

@dataclass
class MercatorTicker(BasicTicker):

    dimension: LatLon | None = ...

@dataclass
class CategoricalTicker(Ticker):
    ...

@dataclass
class DatetimeTicker(CompositeTicker):
    ...

@dataclass
class BinnedTicker(Ticker):

    mapper: ScanningColorMapper = ...

    num_major_ticks: int | Auto = ...
