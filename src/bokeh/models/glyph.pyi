#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..core.has_props import HasProps, abstract
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
class LineGlyph(HasProps):
    ...

@abstract
@dataclass(init=False)
class FillGlyph(HasProps):
    ...

@abstract
@dataclass(init=False)
class TextGlyph(HasProps):
    ...

@abstract
@dataclass(init=False)
class HatchGlyph(HasProps):
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
