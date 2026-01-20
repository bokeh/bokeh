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
from ..core.enums import (
    JitterRandomDistributionType as JitterRandomDistribution,
    StepModeType as StepMode,
)
from ..model.model import Model, ModelInit
from .ranges import Range
from .sources import ColumnarDataSource

class TransformInit(ModelInit, total=False):
    ...

class Transform(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[TransformInit]) -> None: ...

class CustomJSTransformInit(TransformInit, total=False):
    args: dict[str, Any]
    func: str
    v_func: str

class CustomJSTransform(Transform):
    def __init__(self, **kwargs: Unpack[CustomJSTransformInit]) -> None: ...

    args: dict[str, Any] = ...
    func: str = ...
    v_func: str = ...

class DodgeInit(TransformInit, total=False):
    value: float
    range: Range | None

class Dodge(Transform):
    def __init__(self, **kwargs: Unpack[DodgeInit]) -> None: ...

    value: float = ...
    range: Range | None = ...

class JitterInit(TransformInit, total=False):
    mean: float
    width: float
    distribution: JitterRandomDistribution
    range: Range | None

class Jitter(Transform):
    def __init__(self, **kwargs: Unpack[JitterInit]) -> None: ...

    mean: float = ...
    width: float = ...
    distribution: JitterRandomDistribution = ...
    range: Range | None = ...

class InterpolatorInit(TransformInit, total=False):
    x: str | Sequence[float] | None
    y: str | Sequence[float] | None
    data: ColumnarDataSource | None
    clip: bool

class Interpolator(Transform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[InterpolatorInit]) -> None: ...

    x: str | Sequence[float] | None = ...
    y: str | Sequence[float] | None = ...
    data: ColumnarDataSource | None = ...
    clip: bool = ...

class LinearInterpolatorInit(InterpolatorInit, total=False):
    ...

class LinearInterpolator(Interpolator):
    def __init__(self, **kwargs: Unpack[LinearInterpolatorInit]) -> None: ...

class StepInterpolatorInit(InterpolatorInit, total=False):
    mode: StepMode

class StepInterpolator(Interpolator):
    def __init__(self, **kwargs: Unpack[StepInterpolatorInit]) -> None: ...

    mode: StepMode = ...
