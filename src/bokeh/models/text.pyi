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

class _BaseTextInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    text: str

class BaseText(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_BaseTextInit]) -> None: ...

    text: str = ...

class _MathTextInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    text: str

class MathText(BaseText):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MathTextInit]) -> None: ...

class _AsciiInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    text: str

class Ascii(MathText):
    def __init__(self, **kwargs: Unpack[_AsciiInit]) -> None: ...

class _MathMLInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    text: str

class MathML(MathText):
    def __init__(self, **kwargs: Unpack[_MathMLInit]) -> None: ...

class _TeXInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    text: str
    macros: dict[str, str | tuple[str, int]]
    inline: bool

class TeX(MathText):
    def __init__(self, **kwargs: Unpack[_TeXInit]) -> None: ...

    macros: dict[str, str | tuple[str, int]] = ...
    inline: bool = ...

class _PlainTextInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    text: str

class PlainText(BaseText):
    def __init__(self, **kwargs: Unpack[_PlainTextInit]) -> None: ...
