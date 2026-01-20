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
from .transforms import Transform, TransformInit

class ScaleInit(TransformInit, total=False):
    ...

class Scale(Transform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ScaleInit]) -> None: ...

class ContinuousScaleInit(ScaleInit, total=False):
    ...

class ContinuousScale(Scale):
    def __init__(self, **kwargs: Unpack[ContinuousScaleInit]) -> None: ...

class LinearScaleInit(ContinuousScaleInit, total=False):
    ...

class LinearScale(ContinuousScale):
    def __init__(self, **kwargs: Unpack[LinearScaleInit]) -> None: ...

class LogScaleInit(ContinuousScaleInit, total=False):
    ...

class LogScale(ContinuousScale):
    def __init__(self, **kwargs: Unpack[LogScaleInit]) -> None: ...

class CategoricalScaleInit(ScaleInit, total=False):
    ...

class CategoricalScale(Scale):
    def __init__(self, **kwargs: Unpack[CategoricalScaleInit]) -> None: ...

class CompositeScaleInit(ScaleInit, total=False):
    source_scale: Scale
    target_scale: Scale

class CompositeScale(Scale):
    def __init__(self, **kwargs: Unpack[CompositeScaleInit]) -> None: ...

    source_scale: Scale = ...
    target_scale: Scale = ...
