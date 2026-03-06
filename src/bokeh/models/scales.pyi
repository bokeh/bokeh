#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..core.has_props import abstract
from .transforms import Transform

@abstract
@dataclass(init=False)
class Scale(Transform):
    ...

@dataclass
class ContinuousScale(Scale):
    ...

@dataclass
class LinearScale(ContinuousScale):
    ...

@dataclass
class LogScale(ContinuousScale):
    ...

@dataclass
class CategoricalScale(Scale):
    ...

@dataclass
class CompositeScale(Scale):

    source_scale: Scale = ...

    target_scale: Scale = ...
