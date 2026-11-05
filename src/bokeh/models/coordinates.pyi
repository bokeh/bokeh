#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from typing import Unpack

from ..model.model import Model, _ModelInit
from .ranges import Range
from .scales import Scale

class _CoordinateMappingInit(_ModelInit, total=False):
    x_source: Range
    y_source: Range
    x_scale: Scale
    y_scale: Scale
    x_target: Range
    y_target: Range

class CoordinateMapping(Model):
    def __init__(self, **kwargs: Unpack[_CoordinateMappingInit]) -> None: ...

    x_source: Range = ...
    y_source: Range = ...
    x_scale: Scale = ...
    y_scale: Scale = ...
    x_target: Range = ...
    y_target: Range = ...
