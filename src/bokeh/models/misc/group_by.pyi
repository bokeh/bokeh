#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...model.model import JSEventCallback, Model, _ModelInit

# class _GroupByInit(_ModelInit, total=False):
#     ...

class _GroupByInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class GroupBy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GroupByInit]) -> None: ...

# class _GroupByModelsInit(_GroupByInit, total=False):
#     groups: list[list[Model]]

class _GroupByModelsInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    groups: list[list[Model]]

class GroupByModels(GroupBy):
    def __init__(self, **kwargs: Unpack[_GroupByModelsInit]) -> None: ...

    groups: list[list[Model]] = ...

# class _GroupByNameInit(_GroupByInit, total=False):
#     ...

class _GroupByNameInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class GroupByName(GroupBy):
    def __init__(self, **kwargs: Unpack[_GroupByNameInit]) -> None: ...
