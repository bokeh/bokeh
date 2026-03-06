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
from ..model.model import JSEventCallback, Model, _ModelInit

# class _BaseTextInit(_ModelInit, total=False):
#     text: str

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

# class _MathTextInit(_BaseTextInit, total=False):
#     ...

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

# class _AsciiInit(_MathTextInit, total=False):
#     ...

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

# class _MathMLInit(_MathTextInit, total=False):
#     ...

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

# class _TeXInit(_MathTextInit, total=False):
#     macros: dict[str, str | tuple[str, int]]
#     inline: bool

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

# class _PlainTextInit(_BaseTextInit, total=False):
#     ...

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
