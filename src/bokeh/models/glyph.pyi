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
from ..core.has_props import HasProps
from ..model.model import JSEventCallback, Model, _ModelInit
from .graphics import Decoration

# class _GlyphInit(_ModelInit, total=False):
#     decorations: list[Decoration]

class _GlyphInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]

class Glyph(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GlyphInit]) -> None: ...

    decorations: list[Decoration] = ...

# class _XYGlyphInit(_GlyphInit, total=False):
#     ...

class _XYGlyphInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]

class XYGlyph(Glyph):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_XYGlyphInit]) -> None: ...

# class _RadialGlyphInit(_XYGlyphInit, total=False):
#     ...

class _RadialGlyphInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]

class RadialGlyph(XYGlyph):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_RadialGlyphInit]) -> None: ...

# class _ConnectedXYGlyphInit(_XYGlyphInit, total=False):
#     ...

class _ConnectedXYGlyphInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]

class ConnectedXYGlyph(XYGlyph):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ConnectedXYGlyphInit]) -> None: ...

# class _LineGlyphInit(TypedDict, total=False):
#     ...

class _LineGlyphInit(TypedDict, total=False):
    ...

class LineGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_LineGlyphInit]) -> None: ...

# class _FillGlyphInit(TypedDict, total=False):
#     ...

class _FillGlyphInit(TypedDict, total=False):
    ...

class FillGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_FillGlyphInit]) -> None: ...

# class _TextGlyphInit(TypedDict, total=False):
#     ...

class _TextGlyphInit(TypedDict, total=False):
    ...

class TextGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TextGlyphInit]) -> None: ...

# class _HatchGlyphInit(TypedDict, total=False):
#     ...

class _HatchGlyphInit(TypedDict, total=False):
    ...

class HatchGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_HatchGlyphInit]) -> None: ...

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
