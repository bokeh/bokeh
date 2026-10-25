#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from abc import abstractmethod
from typing import Literal, Unpack

from .._specs import DataSpec, NumberSpec
from ..model.model import Model, _ModelInit

class _MarkingInit(_ModelInit, total=False):
    inherit_visuals: list[str]

class Marking(Model):
    inherit_visuals: list[str] = ...
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MarkingInit]) -> None: ...

class Decoration(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ModelInit]) -> None: ...

class _PathDecorationInit(_ModelInit, total=False):
    marking: Marking
    node: Literal["start", "middle", "end"]
    inset: NumberSpec

class PathDecoration(Decoration):
    def __init__(self, **kwargs: Unpack[_PathDecorationInit]) -> None: ...
    marking: Marking = ...
    node: Literal["start", "middle", "end"] = ...
    inset: NumberSpec = ...

class _PathMarkingsInit(_ModelInit, total=False):
    marking: Marking
    positions: DataSpec[list[float]]

class PathMarkings(Decoration):
    def __init__(self, **kwargs: Unpack[_PathMarkingsInit]) -> None: ...
    marking: Marking = ...
    positions: DataSpec[list[float]] = ...
