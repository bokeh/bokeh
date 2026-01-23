#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Unpack

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

class _CustomDimensionalInit(_DimensionalInit, total=False):
    basis: dict[str, tuple[float, str] | tuple[float, str, str]]

class CustomDimensional(Dimensional):
    def __init__(self, **kwargs: Unpack[_CustomDimensionalInit]) -> None: ...

    basis: dict[str, tuple[float, str] | tuple[float, str, str]] = ...

class _MetricInit(_DimensionalInit, total=False):
    base_unit: str
    full_unit: str | None

class Metric(Dimensional):
    def __init__(self, **kwargs: Unpack[_MetricInit]) -> None: ...

    base_unit: str = ...
    full_unit: str | None = ...

class _ReciprocalMetricInit(_MetricInit, total=False):
    ...

class ReciprocalMetric(Metric):
    def __init__(self, **kwargs: Unpack[_ReciprocalMetricInit]) -> None: ...

class _MetricLengthInit(_MetricInit, total=False):
    ...

class MetricLength(Metric):
    def __init__(self, **kwargs: Unpack[_MetricLengthInit]) -> None: ...

class _ReciprocalMetricLengthInit(_ReciprocalMetricInit, total=False):
    ...

class ReciprocalMetricLength(ReciprocalMetric):
    def __init__(self, **kwargs: Unpack[_ReciprocalMetricLengthInit]) -> None: ...

class _ImperialLengthInit(_CustomDimensionalInit, total=False):
    ...

class ImperialLength(CustomDimensional):
    def __init__(self, **kwargs: Unpack[_ImperialLengthInit]) -> None: ...

class _AngularInit(_CustomDimensionalInit, total=False):
    ...

class Angular(CustomDimensional):
    def __init__(self, **kwargs: Unpack[_AngularInit]) -> None: ...
