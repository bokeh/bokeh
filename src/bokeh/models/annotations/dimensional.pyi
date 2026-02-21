#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...model.model import Model, _ModelInit

class _DimensionalInit(_ModelInit, total=False):
    ticks: list[float]
    include: list[str] | None
    exclude: list[str]

class Dimensional(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DimensionalInit]) -> None: ...

    ticks: list[float] = ...
    include: list[str] | None = ...
    exclude: list[str] = ...

    def is_known(self, unit: str) -> bool: ...

class _CustomDimensionalInit(_ModelInit, total=False):
    ticks: list[float]
    include: list[str] | None
    exclude: list[str]
    basis: dict[str, tuple[float, str] | tuple[float, str, str]]

class CustomDimensional(Dimensional):
    def __init__(self, **kwargs: Unpack[_CustomDimensionalInit]) -> None: ...

    basis: dict[str, tuple[float, str] | tuple[float, str, str]] = ...

class _MetricInit(_ModelInit, total=False):
    ticks: list[float]
    include: list[str] | None
    exclude: list[str]
    base_unit: str
    full_unit: str | None

class Metric(Dimensional):
    def __init__(self, **kwargs: Unpack[_MetricInit]) -> None: ...

    base_unit: str = ...
    full_unit: str | None = ...

class _ReciprocalMetricInit(_ModelInit, total=False):
    ticks: list[float]
    include: list[str] | None
    exclude: list[str]
    base_unit: str
    full_unit: str | None

class ReciprocalMetric(Metric):
    def __init__(self, **kwargs: Unpack[_ReciprocalMetricInit]) -> None: ...

class _MetricLengthInit(_ModelInit, total=False):
    ticks: list[float]
    include: list[str] | None
    exclude: list[str]
    base_unit: str
    full_unit: str | None

class MetricLength(Metric):
    def __init__(self, **kwargs: Unpack[_MetricLengthInit]) -> None: ...

class _ReciprocalMetricLengthInit(_ModelInit, total=False):
    ticks: list[float]
    include: list[str] | None
    exclude: list[str]
    base_unit: str
    full_unit: str | None

class ReciprocalMetricLength(ReciprocalMetric):
    def __init__(self, **kwargs: Unpack[_ReciprocalMetricLengthInit]) -> None: ...

class _ImperialLengthInit(_ModelInit, total=False):
    ticks: list[float]
    include: list[str] | None
    exclude: list[str]
    basis: dict[str, tuple[float, str] | tuple[float, str, str]]

class ImperialLength(CustomDimensional):
    def __init__(self, **kwargs: Unpack[_ImperialLengthInit]) -> None: ...

class _AngularInit(_ModelInit, total=False):
    ticks: list[float]
    include: list[str] | None
    exclude: list[str]
    basis: dict[str, tuple[float, str] | tuple[float, str, str]]

class Angular(CustomDimensional):
    def __init__(self, **kwargs: Unpack[_AngularInit]) -> None: ...
