#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Unpack

# Bokeh imports
from ..model.model import Model, ModelInit

class LabelingPolicyInit(ModelInit, total=False):
    ...

class LabelingPolicy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[LabelingPolicyInit]) -> None: ...

class AllLabelsInit(LabelingPolicyInit, total=False):
    ...

class AllLabels(LabelingPolicy):
    def __init__(self, **kwargs: Unpack[AllLabelsInit]) -> None: ...

class NoOverlapInit(LabelingPolicyInit, total=False):
    min_distance: int

class NoOverlap(LabelingPolicy):
    def __init__(self, **kwargs: Unpack[NoOverlapInit]) -> None: ...

    min_distance: int = ...

class CustomLabelingPolicyInit(LabelingPolicyInit, total=False):
    args: dict[str, Any]
    code: str

class CustomLabelingPolicy(LabelingPolicy):
    def __init__(self, **kwargs: Unpack[CustomLabelingPolicyInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...
