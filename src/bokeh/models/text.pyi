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
from ..model.model import Model, _ModelInit

class _BaseTextInit(_ModelInit, total=False):
    text: str

class BaseText(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_BaseTextInit]) -> None: ...

    text: str = ...

class _MathTextInit(_BaseTextInit, total=False):
    ...

class MathText(BaseText):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MathTextInit]) -> None: ...

class _AsciiInit(_MathTextInit, total=False):
    ...

class Ascii(MathText):
    def __init__(self, **kwargs: Unpack[_AsciiInit]) -> None: ...

class _MathMLInit(_MathTextInit, total=False):
    ...

class MathML(MathText):
    def __init__(self, **kwargs: Unpack[_MathMLInit]) -> None: ...

class _TeXInit(_MathTextInit, total=False):
    macros: dict[str, str | tuple[str, int]]
    inline: bool

class TeX(MathText):
    def __init__(self, **kwargs: Unpack[_TeXInit]) -> None: ...

    macros: dict[str, str | tuple[str, int]] = ...
    inline: bool = ...

class _PlainTextInit(_BaseTextInit, total=False):
    ...

class PlainText(BaseText):
    def __init__(self, **kwargs: Unpack[_PlainTextInit]) -> None: ...
