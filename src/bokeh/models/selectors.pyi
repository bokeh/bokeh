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
from ..model.model import Model

from ..model.model import JSEventCallback
from typing import Any
from typing import TypedDict

class _SelectorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    query: str

class Selector(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_SelectorInit]) -> None: ...

    query: str = ...

class _ByIDInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    query: str

class ByID(Selector):
    def __init__(self, **kwargs: Unpack[_ByIDInit]) -> None: ...

class _ByClassInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    query: str

class ByClass(Selector):
    def __init__(self, **kwargs: Unpack[_ByClassInit]) -> None: ...

class _ByCSSInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    query: str

class ByCSS(Selector):
    def __init__(self, **kwargs: Unpack[_ByCSSInit]) -> None: ...

class _ByXPathInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    query: str

class ByXPath(Selector):
    def __init__(self, **kwargs: Unpack[_ByXPathInit]) -> None: ...
