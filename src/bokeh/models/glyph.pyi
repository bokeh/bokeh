#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from abc import abstractmethod
from typing import TypedDict, Unpack

from ..core.has_props import HasProps
from ..model.model import Model, _ModelInit
from .graphics import PathPlacement

class _GlyphInit(_ModelInit, total=False):
    ...

class Glyph(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GlyphInit]) -> None: ...

class _XYGlyphInit(_GlyphInit, total=False):
    ...

class XYGlyph(Glyph):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_XYGlyphInit]) -> None: ...

class _RadialGlyphInit(_XYGlyphInit, total=False):
    ...

class RadialGlyph(XYGlyph):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_RadialGlyphInit]) -> None: ...

class _ConnectedXYGlyphInit(_XYGlyphInit, total=False):
    ...

class ConnectedXYGlyph(XYGlyph):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ConnectedXYGlyphInit]) -> None: ...

class _LineGlyphInit(TypedDict, total=False):
    ...

class LineGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_LineGlyphInit]) -> None: ...

class _FillGlyphInit(TypedDict, total=False):
    ...

class FillGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_FillGlyphInit]) -> None: ...

class _TextGlyphInit(TypedDict, total=False):
    ...

class TextGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TextGlyphInit]) -> None: ...

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

class _SupportsPathMarkingInit(TypedDict, total=False):
    path_markings: list[PathPlacement]

class SupportsPathMarking(HasProps):
    path_markings: list[PathPlacement] = ...
