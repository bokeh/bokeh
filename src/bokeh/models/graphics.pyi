#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Literal, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..model.model import JSEventCallback, Model, _ModelInit

# class _MarkingInit(_ModelInit, total=False):
#     ...

class _MarkingInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class Marking(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MarkingInit]) -> None: ...

# class _DecorationInit(_ModelInit, total=False):
#     marking: Marking
#     node: Literal["start", "middle", "end"]

class _DecorationInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    marking: Marking
    node: Literal["start", "middle", "end"]

class Decoration(Model):
    def __init__(self, **kwargs: Unpack[_DecorationInit]) -> None: ...

    marking: Marking = ...
    node: Literal["start", "middle", "end"] = ...
