#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Any, TypedDict

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..model.model import JSEventCallback, Model, _ModelInit

# class _ComparisonInit(_ModelInit, total=False):
#     ...

class _ComparisonInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class Comparison(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ComparisonInit]) -> None: ...

# class _CustomJSCompareInit(_ComparisonInit, total=False):
#     args: dict[str, Any]
#     code: str

class _CustomJSCompareInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    args: dict[str, Any]
    code: str

class CustomJSCompare(Comparison):
    def __init__(self, **kwargs: Unpack[_CustomJSCompareInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...

# class _NanCompareInit(_ComparisonInit, total=False):
#     ascending_first: bool

class _NanCompareInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    ascending_first: bool

class NanCompare(Comparison):
    def __init__(self, **kwargs: Unpack[_NanCompareInit]) -> None: ...

    ascending_first: bool = ...
