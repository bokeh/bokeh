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
from ..core.enums import AutoType as Auto, LatLonType as LatLon
from ..model.model import Model, ModelInit
from .mappers import ScanningColorMapper

class TickerInit(ModelInit, total=False):
    ...

class Ticker(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[TickerInit]) -> None: ...

class CustomJSTickerInit(TickerInit, total=False):
    args: dict[str, Any]
    major_code: str
    minor_code: str

class CustomJSTicker(Ticker):
    def __init__(self, **kwargs: Unpack[CustomJSTickerInit]) -> None: ...

    args: dict[str, Any] = ...
    major_code: str = ...
    minor_code: str = ...

class ContinuousTickerInit(TickerInit, total=False):
    num_minor_ticks: int
    desired_num_ticks: int

class ContinuousTicker(Ticker):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ContinuousTickerInit]) -> None: ...

    num_minor_ticks: int = ...
    desired_num_ticks: int = ...

class FixedTickerInit(ContinuousTickerInit, total=False):
    ticks: Sequence[float]
    minor_ticks: Sequence[float]

class FixedTicker(ContinuousTicker):
    def __init__(self, **kwargs: Unpack[FixedTickerInit]) -> None: ...

    ticks: Sequence[float] = ...
    minor_ticks: Sequence[float] = ...

class AdaptiveTickerInit(ContinuousTickerInit, total=False):
    base: float
    mantissas: Sequence[float]
    min_interval: float
    max_interval: float | None

class AdaptiveTicker(ContinuousTicker):
    def __init__(self, **kwargs: Unpack[AdaptiveTickerInit]) -> None: ...

    base: float = ...
    mantissas: Sequence[float] = ...
    min_interval: float = ...
    max_interval: float | None = ...

class CompositeTickerInit(ContinuousTickerInit, total=False):
    tickers: Sequence[Ticker]

class CompositeTicker(ContinuousTicker):
    def __init__(self, **kwargs: Unpack[CompositeTickerInit]) -> None: ...

    tickers: Sequence[Ticker] = ...

class BaseSingleIntervalTickerInit(ContinuousTickerInit, total=False):
    ...

class BaseSingleIntervalTicker(ContinuousTicker):
    def __init__(self, **kwargs: Unpack[BaseSingleIntervalTickerInit]) -> None: ...

class SingleIntervalTickerInit(BaseSingleIntervalTickerInit, total=False):
    interval: float

class SingleIntervalTicker(BaseSingleIntervalTicker):
    def __init__(self, **kwargs: Unpack[SingleIntervalTickerInit]) -> None: ...

    interval: float = ...

class DaysTickerInit(BaseSingleIntervalTickerInit, total=False):
    days: Sequence[int]

class DaysTicker(BaseSingleIntervalTicker):
    def __init__(self, **kwargs: Unpack[DaysTickerInit]) -> None: ...

    days: Sequence[int] = ...

class MonthsTickerInit(BaseSingleIntervalTickerInit, total=False):
    months: Sequence[int]

class MonthsTicker(BaseSingleIntervalTicker):
    def __init__(self, **kwargs: Unpack[MonthsTickerInit]) -> None: ...

    months: Sequence[int] = ...

class YearsTickerInit(BaseSingleIntervalTickerInit, total=False):
    ...

class YearsTicker(BaseSingleIntervalTicker):
    def __init__(self, **kwargs: Unpack[YearsTickerInit]) -> None: ...

class BasicTickerInit(AdaptiveTickerInit, total=False):
    ...

class BasicTicker(AdaptiveTicker):
    def __init__(self, **kwargs: Unpack[BasicTickerInit]) -> None: ...

class LogTickerInit(AdaptiveTickerInit, total=False):
    ...

class LogTicker(AdaptiveTicker):
    def __init__(self, **kwargs: Unpack[LogTickerInit]) -> None: ...

class MercatorTickerInit(BasicTickerInit, total=False):
    dimension: LatLon | None

class MercatorTicker(BasicTicker):
    def __init__(self, **kwargs: Unpack[MercatorTickerInit]) -> None: ...

    dimension: LatLon | None = ...

class CategoricalTickerInit(TickerInit, total=False):
    ...

class CategoricalTicker(Ticker):
    def __init__(self, **kwargs: Unpack[CategoricalTickerInit]) -> None: ...

class DatetimeTickerInit(CompositeTickerInit, total=False):
    ...

class DatetimeTicker(CompositeTicker):
    def __init__(self, **kwargs: Unpack[DatetimeTickerInit]) -> None: ...

class TimedeltaTickerInit(CompositeTickerInit, total=False):
    ...

class TimedeltaTicker(CompositeTicker):
    def __init__(self, **kwargs: Unpack[TimedeltaTickerInit]) -> None: ...

class BinnedTickerInit(TickerInit, total=False):
    mapper: ScanningColorMapper
    num_major_ticks: int | Auto

class BinnedTicker(Ticker):
    def __init__(self, **kwargs: Unpack[BinnedTickerInit]) -> None: ...

    mapper: ScanningColorMapper = ...
    num_major_ticks: int | Auto = ...
