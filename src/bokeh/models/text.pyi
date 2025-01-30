#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..core.has_props import abstract
from ..model import Model

@abstract
@dataclass(init=False)
class BaseText(Model):

    text: str = ...

@abstract
@dataclass(init=False)
class MathText(BaseText):
    ...

@dataclass
class Ascii(MathText):
    ...

@dataclass
class MathML(MathText):
    ...

@dataclass
class TeX(MathText):

    macros: dict[str, str | tuple[str, int]] = ...

    inline: bool = ...

@dataclass
class PlainText(BaseText):
    ...
