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
from ..._specs import NumberSpec
from ...core.enums import CoordinateUnitsType as CoordinateUnits
from ...core.property_mixins import (
    BodyLineProps,
    FillProps,
    HatchProps,
    LineProps,
    _BodyLinePropsInit,
    _FillPropsInit,
    _HatchPropsInit,
    _LinePropsInit,
)
from ..graphics import Marking, _MarkingInit
from .annotation import DataAnnotation, _DataAnnotationInit

class _ArrowHeadInit(_MarkingInit, total=False):
    size: NumberSpec

class ArrowHead(Marking):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ArrowHeadInit]) -> None: ...

    size: NumberSpec = ...

class _OpenHeadInit(_ArrowHeadInit, _LinePropsInit, total=False):
    ...

class OpenHead(ArrowHead, LineProps):
    ...

class _NormalHeadInit(_ArrowHeadInit, _LinePropsInit, _FillPropsInit, _HatchPropsInit, total=False):
    ...

class NormalHead(ArrowHead, LineProps, FillProps, HatchProps):
    ...

class _TeeHeadInit(_ArrowHeadInit, _LinePropsInit, total=False):
    ...

class TeeHead(ArrowHead, LineProps):
    ...

class _VeeHeadInit(_ArrowHeadInit, _LinePropsInit, _FillPropsInit, _HatchPropsInit, total=False):
    ...

class VeeHead(ArrowHead, LineProps, FillProps, HatchProps):
    ...

class _ArrowInit(_DataAnnotationInit, _BodyLinePropsInit, total=False):
    x_start: NumberSpec
    y_start: NumberSpec
    start_units: CoordinateUnits
    start: ArrowHead | None
    x_end: NumberSpec
    y_end: NumberSpec
    end_units: CoordinateUnits
    end: ArrowHead | None

class Arrow(DataAnnotation, BodyLineProps):

    x_start: NumberSpec = ...
    y_start: NumberSpec = ...
    start_units: CoordinateUnits = ...
    start: ArrowHead | None = ...
    x_end: NumberSpec = ...
    y_end: NumberSpec = ...
    end_units: CoordinateUnits = ...
    end: ArrowHead | None = ...
