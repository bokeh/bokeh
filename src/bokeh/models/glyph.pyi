#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, TypedDict

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..core.has_props import HasProps
from ..model.model import Model, _ModelInit
from .graphics import Decoration

class _GlyphInit(_ModelInit, total=False):
    decorations: list[Decoration]

class Glyph(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GlyphInit]) -> None: ...

    decorations: list[Decoration] = ...

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
