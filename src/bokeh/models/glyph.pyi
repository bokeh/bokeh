# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..core.has_props import abstract
from ..model import Model
from .graphics import Decoration

@abstract
@dataclass(init=False)
class Glyph(Model):

    decorations: list[Decoration] = ...

@abstract
@dataclass(init=False)
class XYGlyph(Glyph):
    ...

@abstract
@dataclass(init=False)
class RadialGlyph(XYGlyph):
    ...

@abstract
@dataclass(init=False)
class ConnectedXYGlyph(XYGlyph):
    ...

@abstract
@dataclass(init=False)
class LineGlyph(Glyph):
    ...

@abstract
@dataclass(init=False)
class FillGlyph(Glyph):
    ...

@abstract
@dataclass(init=False)
class TextGlyph(Glyph):
    ...

@abstract
@dataclass(init=False)
class HatchGlyph(Glyph):
    ...

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
