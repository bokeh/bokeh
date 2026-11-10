#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from abc import abstractmethod
from typing import Literal, Unpack

from .._specs import AngleSpec, DataSpec, NumberSpec
from ..core.enums import AngleUnitsType as AngleUnits
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

class _PathMarkingInit(_ModelInit, total=False):
    angle: AngleSpec
    angle_units: AngleUnits
    angle_reference: Literal["auto", "left", "right", "screen"]
    marking: Marking
    node: Literal["start", "middle", "end"]
    inset: NumberSpec

class PathMarking(Decoration):
    def __init__(self, **kwargs: Unpack[_PathMarkingInit]) -> None: ...
    angle: AngleSpec = ...
    angle_units: AngleUnits = ...
    angle_reference: Literal["auto", "left", "right", "screen"] = ...
    marking: Marking = ...
    node: Literal["start", "middle", "end"] = ...
    inset: NumberSpec = ...

class _PathMarkingsInit(_ModelInit, total=False):
    angle: AngleSpec
    angle_units: AngleUnits
    angle_reference: Literal["auto", "left", "right", "screen"]
    marking: Marking
    positions: DataSpec[list[float]]

class PathMarkings(Decoration):
    def __init__(self, **kwargs: Unpack[_PathMarkingsInit]) -> None: ...
    angle: AngleSpec = ...
    angle_units: AngleUnits = ...
    angle_reference: Literal["auto", "left", "right", "screen"] = ...
    marking: Marking = ...
    positions: DataSpec[list[float]] = ...
