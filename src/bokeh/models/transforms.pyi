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
from ..model.model import Model, _ModelInit
from .ranges import Range
from .sources import ColumnarDataSource

class _TransformInit(_ModelInit, total=False):
    ...

class Transform(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TransformInit]) -> None: ...

class _CustomJSTransformInit(_TransformInit, total=False):
    args: dict[str, Any]
    func: str
    v_func: str

class CustomJSTransform(Transform):
    def __init__(self, **kwargs: Unpack[_CustomJSTransformInit]) -> None: ...

    args: dict[str, Any] = ...
    func: str = ...
    v_func: str = ...

class _DodgeInit(_TransformInit, total=False):
    value: float
    range: Range | None

class Dodge(Transform):
    def __init__(self, **kwargs: Unpack[_DodgeInit]) -> None: ...

    value: float = ...
    range: Range | None = ...

class _JitterInit(_TransformInit, total=False):
    mean: float
    width: float
    distribution: JitterRandomDistribution
    range: Range | None

class Jitter(Transform):
    def __init__(self, **kwargs: Unpack[_JitterInit]) -> None: ...

    mean: float = ...
    width: float = ...
    distribution: JitterRandomDistribution = ...
    range: Range | None = ...

class _InterpolatorInit(_TransformInit, total=False):
    x: str | Sequence[float] | None
    y: str | Sequence[float] | None
    data: ColumnarDataSource | None
    clip: bool

class Interpolator(Transform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_InterpolatorInit]) -> None: ...

    x: str | Sequence[float] | None = ...
    y: str | Sequence[float] | None = ...
    data: ColumnarDataSource | None = ...
    clip: bool = ...

class _LinearInterpolatorInit(_InterpolatorInit, total=False):
    ...

class LinearInterpolator(Interpolator):
    def __init__(self, **kwargs: Unpack[_LinearInterpolatorInit]) -> None: ...

class _StepInterpolatorInit(_InterpolatorInit, total=False):
    mode: StepMode

class StepInterpolator(Interpolator):
    def __init__(self, **kwargs: Unpack[_StepInterpolatorInit]) -> None: ...

    mode: StepMode = ...
