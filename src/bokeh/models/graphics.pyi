#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from abc import abstractmethod
from typing import Literal, Unpack

from .._specs import AngleSpec, DataSpec, NumberSpec, SizeSpec
from ..core.enums import (
    AngleReferenceType as AngleReference,
    AngleUnitsType as AngleUnits,
    MarkerTypeType as MarkerType,
)
from ..core.property_mixins import (
    FillProps,
    HatchProps,
    LineProps,
    _FillPropsInit,
    _HatchPropsInit,
    _LinePropsInit,
)
from ..model.model import Model, _ModelInit

class _MarkingInit(_ModelInit, total=False):
    inherit_visuals: list[str]

class Marking(Model):
    inherit_visuals: list[str] = ...
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MarkingInit]) -> None: ...

class _ScatterMarkingInit(_MarkingInit, _FillPropsInit, _HatchPropsInit, _LinePropsInit, total=False):
    marker: MarkerType
    size: SizeSpec

class ScatterMarking(Marking, FillProps, HatchProps, LineProps):
    def __init__(self, **kwargs: Unpack[_ScatterMarkingInit]) -> None: ...
    marker: MarkerType = ...
    size: SizeSpec = ...

type PathPositions = Literal["start", "middle", "end"] | DataSpec[list[float]]

class _PathMarkingInit(_ModelInit, total=False):
    marking: Marking
    positions: PathPositions
    angle: AngleSpec
    angle_units: AngleUnits
    angle_reference: AngleReference
    inset: NumberSpec

class PathPlacement(Model):
    def __init__(self, **kwargs: Unpack[_PathMarkingInit]) -> None: ...
    marking: Marking = ...
    positions: PathPositions = ...
    angle: AngleSpec = ...
    angle_units: AngleUnits = ...
    angle_reference: AngleReference = ...
    inset: NumberSpec = ...
