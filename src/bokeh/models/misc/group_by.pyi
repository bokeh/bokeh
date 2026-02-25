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
from ...model.model import Model

from ...model.model import JSEventCallback
from typing import Any
from typing import TypedDict

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

class _GroupByNameInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class GroupByName(GroupBy):
    def __init__(self, **kwargs: Unpack[_GroupByNameInit]) -> None: ...
