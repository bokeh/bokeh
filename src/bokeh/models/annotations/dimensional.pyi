#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.has_props import abstract
from ...model import Model

@abstract
@dataclass(init=False)
class Dimensional(Model):

    ticks: list[float] = ...

    include: list[str] | None = ...

    exclude: list[str] = ...

    def is_known(self, unit: str) -> bool: ...

@dataclass
class CustomDimensional(Dimensional):

    basis: dict[str, tuple[float, str] | tuple[float, str, str]] = ...

@dataclass
class Metric(Dimensional):

    base_unit: str = ...

    full_unit: str | None = ...

@dataclass
class ReciprocalMetric(Metric):
    ...

@dataclass
class MetricLength(Metric):
    ...

@dataclass
class ReciprocalMetricLength(ReciprocalMetric):
    ...

@dataclass
class ImperialLength(CustomDimensional):
    ...

@dataclass
class Angular(CustomDimensional):
    ...
