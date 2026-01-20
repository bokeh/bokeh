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
from ...model.model import Model, ModelInit

class DimensionalInit(ModelInit, total=False):
    ticks: list[float]
    include: list[str] | None
    exclude: list[str]

class Dimensional(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[DimensionalInit]) -> None: ...

    ticks: list[float] = ...
    include: list[str] | None = ...
    exclude: list[str] = ...

    def is_known(self, unit: str) -> bool: ...

class CustomDimensionalInit(DimensionalInit, total=False):
    basis: dict[str, tuple[float, str] | tuple[float, str, str]]

class CustomDimensional(Dimensional):
    def __init__(self, **kwargs: Unpack[CustomDimensionalInit]) -> None: ...

    basis: dict[str, tuple[float, str] | tuple[float, str, str]] = ...

class MetricInit(DimensionalInit, total=False):
    base_unit: str
    full_unit: str | None

class Metric(Dimensional):
    def __init__(self, **kwargs: Unpack[MetricInit]) -> None: ...

    base_unit: str = ...
    full_unit: str | None = ...

class ReciprocalMetricInit(MetricInit, total=False):
    ...

class ReciprocalMetric(Metric):
    def __init__(self, **kwargs: Unpack[ReciprocalMetricInit]) -> None: ...

class MetricLengthInit(MetricInit, total=False):
    ...

class MetricLength(Metric):
    def __init__(self, **kwargs: Unpack[MetricLengthInit]) -> None: ...

class ReciprocalMetricLengthInit(ReciprocalMetricInit, total=False):
    ...

class ReciprocalMetricLength(ReciprocalMetric):
    def __init__(self, **kwargs: Unpack[ReciprocalMetricLengthInit]) -> None: ...

class ImperialLengthInit(CustomDimensionalInit, total=False):
    ...

class ImperialLength(CustomDimensional):
    def __init__(self, **kwargs: Unpack[ImperialLengthInit]) -> None: ...

class AngularInit(CustomDimensionalInit, total=False):
    ...

class Angular(CustomDimensional):
    def __init__(self, **kwargs: Unpack[AngularInit]) -> None: ...
