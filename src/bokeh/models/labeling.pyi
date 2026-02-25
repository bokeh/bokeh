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
from ..model.model import Model

from ..model.model import JSEventCallback
from typing import TypedDict

class _LabelingPolicyInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class LabelingPolicy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_LabelingPolicyInit]) -> None: ...

class _AllLabelsInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class AllLabels(LabelingPolicy):
    def __init__(self, **kwargs: Unpack[_AllLabelsInit]) -> None: ...

class _NoOverlapInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    min_distance: int

class NoOverlap(LabelingPolicy):
    def __init__(self, **kwargs: Unpack[_NoOverlapInit]) -> None: ...

    min_distance: int = ...

class _CustomLabelingPolicyInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    args: dict[str, Any]
    code: str

class CustomLabelingPolicy(LabelingPolicy):
    def __init__(self, **kwargs: Unpack[_CustomLabelingPolicyInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...
