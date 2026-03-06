#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Any

# Bokeh imports
from ..core.has_props import abstract
from ..model import Model

@abstract
@dataclass(init=False)
class LabelingPolicy(Model):
    ...

@dataclass
class AllLabels(LabelingPolicy):
    ...

@dataclass
class NoOverlap(LabelingPolicy):

    min_distance: int = ...

@dataclass
class CustomLabelingPolicy(LabelingPolicy):

    args: dict[str, Any] = ...

    code: str = ...
