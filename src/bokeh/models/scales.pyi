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
from .transforms import Transform

from ..model.model import JSEventCallback
from typing import Any
from typing import TypedDict

class _ScaleInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class Scale(Transform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ScaleInit]) -> None: ...

class _ContinuousScaleInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class ContinuousScale(Scale):
    def __init__(self, **kwargs: Unpack[_ContinuousScaleInit]) -> None: ...

class _LinearScaleInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class LinearScale(ContinuousScale):
    def __init__(self, **kwargs: Unpack[_LinearScaleInit]) -> None: ...

class _LogScaleInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class LogScale(ContinuousScale):
    def __init__(self, **kwargs: Unpack[_LogScaleInit]) -> None: ...

class _CategoricalScaleInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class CategoricalScale(Scale):
    def __init__(self, **kwargs: Unpack[_CategoricalScaleInit]) -> None: ...

class _CompositeScaleInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    source_scale: Scale
    target_scale: Scale

class CompositeScale(Scale):
    def __init__(self, **kwargs: Unpack[_CompositeScaleInit]) -> None: ...

    source_scale: Scale = ...
    target_scale: Scale = ...
