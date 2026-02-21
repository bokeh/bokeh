#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..model.model import Model, _ModelInit

class _BaseTextInit(_ModelInit, total=False):
    text: str

class BaseText(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_BaseTextInit]) -> None: ...

    text: str = ...

class _MathTextInit(_ModelInit, total=False):
    text: str

class MathText(BaseText):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MathTextInit]) -> None: ...

class _AsciiInit(_ModelInit, total=False):
    text: str

class Ascii(MathText):
    def __init__(self, **kwargs: Unpack[_AsciiInit]) -> None: ...

class _MathMLInit(_ModelInit, total=False):
    text: str

class MathML(MathText):
    def __init__(self, **kwargs: Unpack[_MathMLInit]) -> None: ...

class _TeXInit(_ModelInit, total=False):
    text: str
    macros: dict[str, str | tuple[str, int]]
    inline: bool

class TeX(MathText):
    def __init__(self, **kwargs: Unpack[_TeXInit]) -> None: ...

    macros: dict[str, str | tuple[str, int]] = ...
    inline: bool = ...

class _PlainTextInit(_ModelInit, total=False):
    text: str

class PlainText(BaseText):
    def __init__(self, **kwargs: Unpack[_PlainTextInit]) -> None: ...
