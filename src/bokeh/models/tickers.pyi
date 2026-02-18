#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Any, Sequence

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..core.enums import AutoType as Auto, LatLonType as LatLon
from ..model.model import Model, _ModelInit
from .mappers import ScanningColorMapper

class _TickerInit(_ModelInit, total=False):
    ...

class Ticker(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TickerInit]) -> None: ...

class _CustomJSTickerInit(_TickerInit, total=False):
    args: dict[str, Any]
    major_code: str
    minor_code: str

class CustomJSTicker(Ticker):
    def __init__(self, **kwargs: Unpack[_CustomJSTickerInit]) -> None: ...

    args: dict[str, Any] = ...
    major_code: str = ...
    minor_code: str = ...

class _ContinuousTickerInit(_TickerInit, total=False):
    num_minor_ticks: int
    desired_num_ticks: int

class ContinuousTicker(Ticker):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ContinuousTickerInit]) -> None: ...

    num_minor_ticks: int = ...
    desired_num_ticks: int = ...

class _FixedTickerInit(_ContinuousTickerInit, total=False):
    ticks: Sequence[float]
    minor_ticks: Sequence[float]

class FixedTicker(ContinuousTicker):
    def __init__(self, **kwargs: Unpack[_FixedTickerInit]) -> None: ...

    ticks: Sequence[float] = ...
    minor_ticks: Sequence[float] = ...

class _AdaptiveTickerInit(_ContinuousTickerInit, total=False):
    base: float
    mantissas: Sequence[float]
    min_interval: float
    max_interval: float | None

class AdaptiveTicker(ContinuousTicker):
    def __init__(self, **kwargs: Unpack[_AdaptiveTickerInit]) -> None: ...

    base: float = ...
    mantissas: Sequence[float] = ...
    min_interval: float = ...
    max_interval: float | None = ...

class _CompositeTickerInit(_ContinuousTickerInit, total=False):
    tickers: Sequence[Ticker]

class CompositeTicker(ContinuousTicker):
    def __init__(self, **kwargs: Unpack[_CompositeTickerInit]) -> None: ...

    tickers: Sequence[Ticker] = ...

class _BaseSingleIntervalTickerInit(_ContinuousTickerInit, total=False):
    ...

class BaseSingleIntervalTicker(ContinuousTicker):
    def __init__(self, **kwargs: Unpack[_BaseSingleIntervalTickerInit]) -> None: ...

class _SingleIntervalTickerInit(_BaseSingleIntervalTickerInit, total=False):
    interval: float

class SingleIntervalTicker(BaseSingleIntervalTicker):
    def __init__(self, **kwargs: Unpack[_SingleIntervalTickerInit]) -> None: ...

    interval: float = ...

class _DaysTickerInit(_BaseSingleIntervalTickerInit, total=False):
    days: Sequence[int]

class DaysTicker(BaseSingleIntervalTicker):
    def __init__(self, **kwargs: Unpack[_DaysTickerInit]) -> None: ...

    days: Sequence[int] = ...

class _MonthsTickerInit(_BaseSingleIntervalTickerInit, total=False):
    months: Sequence[int]

class MonthsTicker(BaseSingleIntervalTicker):
    def __init__(self, **kwargs: Unpack[_MonthsTickerInit]) -> None: ...

    months: Sequence[int] = ...

class _YearsTickerInit(_BaseSingleIntervalTickerInit, total=False):
    ...

class YearsTicker(BaseSingleIntervalTicker):
    def __init__(self, **kwargs: Unpack[_YearsTickerInit]) -> None: ...

class _BasicTickerInit(_AdaptiveTickerInit, total=False):
    ...

class BasicTicker(AdaptiveTicker):
    def __init__(self, **kwargs: Unpack[_BasicTickerInit]) -> None: ...

class _LogTickerInit(_AdaptiveTickerInit, total=False):
    ...

class LogTicker(AdaptiveTicker):
    def __init__(self, **kwargs: Unpack[_LogTickerInit]) -> None: ...

class _MercatorTickerInit(_BasicTickerInit, total=False):
    dimension: LatLon | None

class MercatorTicker(BasicTicker):
    def __init__(self, **kwargs: Unpack[_MercatorTickerInit]) -> None: ...

    dimension: LatLon | None = ...

class _CategoricalTickerInit(_TickerInit, total=False):
    ...

class CategoricalTicker(Ticker):
    def __init__(self, **kwargs: Unpack[_CategoricalTickerInit]) -> None: ...

class _DatetimeTickerInit(_CompositeTickerInit, total=False):
    ...

class DatetimeTicker(CompositeTicker):
    def __init__(self, **kwargs: Unpack[_DatetimeTickerInit]) -> None: ...

class _TimedeltaTickerInit(_CompositeTickerInit, total=False):
    ...

class TimedeltaTicker(CompositeTicker):
    def __init__(self, **kwargs: Unpack[_TimedeltaTickerInit]) -> None: ...

class _BinnedTickerInit(_TickerInit, total=False):
    mapper: ScanningColorMapper
    num_major_ticks: int | Auto

class BinnedTicker(Ticker):
    def __init__(self, **kwargs: Unpack[_BinnedTickerInit]) -> None: ...

    mapper: ScanningColorMapper = ...
    num_major_ticks: int | Auto = ...
