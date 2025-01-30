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
    JitterRandomDistributionType as JitterRandomDistribution,
    StepModeType as StepMode,
)
from ..core.has_props import abstract
from ..model import Model
from .ranges import Range
from .sources import ColumnarDataSource

@abstract
@dataclass(init=False)
class Transform(Model):
    ...

@dataclass
class CustomJSTransform(Transform):

    args: dict[str, Any] = ...

    func: str = ...

    v_func: str = ...

@dataclass
class Dodge(Transform):

    value: float = ...

    range: Range | None = ...

@dataclass
class Jitter(Transform):

    mean: float = ...

    width: float = ...

    distribution: JitterRandomDistribution = ...

    range: Range | None = ...

@abstract
@dataclass(init=False)
class Interpolator(Transform):

    x: str | Sequence[float] | None = ...

    y: str | Sequence[float] | None = ...

    data: ColumnarDataSource | None = ...

    clip: bool = ...

@dataclass
class LinearInterpolator(Interpolator):
    ...

@dataclass
class StepInterpolator(Interpolator):

    mode: StepMode = ...
