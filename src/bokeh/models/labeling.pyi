#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..model.model import Model, _ModelInit

class _LabelingPolicyInit(_ModelInit, total=False):
    ...

class LabelingPolicy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_LabelingPolicyInit]) -> None: ...

class _AllLabelsInit(_LabelingPolicyInit, total=False):
    ...

class AllLabels(LabelingPolicy):
    def __init__(self, **kwargs: Unpack[_AllLabelsInit]) -> None: ...

class _NoOverlapInit(_LabelingPolicyInit, total=False):
    min_distance: int

class NoOverlap(LabelingPolicy):
    def __init__(self, **kwargs: Unpack[_NoOverlapInit]) -> None: ...

    min_distance: int = ...

class _CustomLabelingPolicyInit(_LabelingPolicyInit, total=False):
    args: dict[str, Any]
    code: str

class CustomLabelingPolicy(LabelingPolicy):
    def __init__(self, **kwargs: Unpack[_CustomLabelingPolicyInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...
