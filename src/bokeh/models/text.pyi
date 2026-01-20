#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Unpack

# Bokeh imports
from ..model.model import Model, ModelInit

class BaseTextInit(ModelInit, total=False):
    text: str

class BaseText(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[BaseTextInit]) -> None: ...

    text: str = ...

class MathTextInit(BaseTextInit, total=False):
    ...

class MathText(BaseText):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[MathTextInit]) -> None: ...

class AsciiInit(MathTextInit, total=False):
    ...

class Ascii(MathText):
    def __init__(self, **kwargs: Unpack[AsciiInit]) -> None: ...

class MathMLInit(MathTextInit, total=False):
    ...

class MathML(MathText):
    def __init__(self, **kwargs: Unpack[MathMLInit]) -> None: ...

class TeXInit(MathTextInit, total=False):
    macros: dict[str, str | tuple[str, int]]
    inline: bool

class TeX(MathText):
    def __init__(self, **kwargs: Unpack[TeXInit]) -> None: ...

    macros: dict[str, str | tuple[str, int]] = ...
    inline: bool = ...

class PlainTextInit(BaseTextInit, total=False):
    ...

class PlainText(BaseText):
    def __init__(self, **kwargs: Unpack[PlainTextInit]) -> None: ...
