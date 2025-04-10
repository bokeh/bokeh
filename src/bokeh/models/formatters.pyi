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
from ..core.enums import (
    AutoType as Auto,
    ContextWhichType as ContextWhich,
    LatLonType as LatLon,
    LocationType as Location,
    NumeralLanguageType as NumeralLanguage,
    ResolutionTypeType as ResolutionType,
    RoundingFunctionType as RoundingFunction,
)
from ..core.has_props import abstract
from ..model import Model
from .tickers import Ticker

@abstract
@dataclass(init=False)
class TickFormatter(Model):
    ...

@dataclass
class BasicTickFormatter(TickFormatter):

    precision: Auto | int = ...

    use_scientific: bool = ...

    power_limit_high: int = ...

    power_limit_low: int = ...

@dataclass
class MercatorTickFormatter(BasicTickFormatter):

    dimension: LatLon | None = ...

@dataclass
class NumeralTickFormatter(TickFormatter):

    format: str = ...

    language: NumeralLanguage = ...

    rounding: RoundingFunction = ...

@dataclass
class PrintfTickFormatter(TickFormatter):

    format: str = ...

@dataclass
class LogTickFormatter(TickFormatter):

    ticker: Ticker | None = ...

    min_exponent: int = ...

@dataclass
class CategoricalTickFormatter(TickFormatter):
    ...

@dataclass
class CustomJSTickFormatter(TickFormatter):

    args: dict[str, Any] = ...

    code: str = ...

@dataclass
class DatetimeTickFormatter(TickFormatter):

    microseconds: str = ...

    milliseconds: str = ...

    seconds: str = ...

    minsec: str = ...

    minutes: str = ...

    hourmin: str = ...

    hours: str = ...

    days: str = ...

    months: str = ...

    years: str = ...

    strip_leading_zeros: bool | Sequence[ResolutionType] = ...

    boundary_scaling: bool = ...

    hide_repeats: bool = ...

    context: str | DatetimeTickFormatter | None = ...

    context_which: ContextWhich = ...

    context_location: Location = ...
