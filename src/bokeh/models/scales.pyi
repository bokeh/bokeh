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
from .transforms import Transform, _TransformInit

class _ScaleInit(_TransformInit, total=False):
    ...

class Scale(Transform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ScaleInit]) -> None: ...

class _ContinuousScaleInit(_TransformInit, total=False):
    ...

class ContinuousScale(Scale):
    def __init__(self, **kwargs: Unpack[_ContinuousScaleInit]) -> None: ...

class _LinearScaleInit(_TransformInit, total=False):
    ...

class LinearScale(ContinuousScale):
    def __init__(self, **kwargs: Unpack[_LinearScaleInit]) -> None: ...

class _LogScaleInit(_TransformInit, total=False):
    ...

class LogScale(ContinuousScale):
    def __init__(self, **kwargs: Unpack[_LogScaleInit]) -> None: ...

class _CategoricalScaleInit(_TransformInit, total=False):
    ...

class CategoricalScale(Scale):
    def __init__(self, **kwargs: Unpack[_CategoricalScaleInit]) -> None: ...

class _CompositeScaleInit(_TransformInit, total=False):
    source_scale: Scale
    target_scale: Scale

class CompositeScale(Scale):
    def __init__(self, **kwargs: Unpack[_CompositeScaleInit]) -> None: ...

    source_scale: Scale = ...
    target_scale: Scale = ...
