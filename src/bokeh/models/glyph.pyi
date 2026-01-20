#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TypedDict, Unpack

# Bokeh imports
from ..core.has_props import HasProps
from ..model.model import Model, ModelInit
from .graphics import Decoration

class GlyphInit(ModelInit, total=False):
    decorations: list[Decoration]

class Glyph(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[GlyphInit]) -> None: ...

    decorations: list[Decoration] = ...

class XYGlyphInit(GlyphInit, total=False):
    ...

class XYGlyph(Glyph):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[XYGlyphInit]) -> None: ...

class RadialGlyphInit(XYGlyphInit, total=False):
    ...

class RadialGlyph(XYGlyph):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[RadialGlyphInit]) -> None: ...

class ConnectedXYGlyphInit(XYGlyphInit, total=False):
    ...

class ConnectedXYGlyph(XYGlyph):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ConnectedXYGlyphInit]) -> None: ...

class LineGlyphInit(TypedDict, total=False):
    ...

class LineGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[LineGlyphInit]) -> None: ...

class FillGlyphInit(TypedDict, total=False):
    ...

class FillGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[FillGlyphInit]) -> None: ...

class TextGlyphInit(TypedDict, total=False):
    ...

class TextGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[TextGlyphInit]) -> None: ...

class HatchGlyphInit(TypedDict, total=False):
    ...

class HatchGlyph(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[HatchGlyphInit]) -> None: ...

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
