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
    BodyLinePropsInit,
    FillProps,
    FillPropsInit,
    HatchProps,
    HatchPropsInit,
    LineProps,
    LinePropsInit,
)
from ..graphics import Marking, MarkingInit
from .annotation import DataAnnotation, DataAnnotationInit

class ArrowHeadInit(MarkingInit, total=False):
    size: NumberSpec

class ArrowHead(Marking):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ArrowHeadInit]) -> None: ...

    size: NumberSpec = ...

class OpenHeadInit(ArrowHeadInit, LinePropsInit, total=False):
    ...

class OpenHead(ArrowHead, LineProps):
    ...

class NormalHeadInit(ArrowHeadInit, LinePropsInit, FillPropsInit, HatchPropsInit, total=False):
    ...

class NormalHead(ArrowHead, LineProps, FillProps, HatchProps):
    ...

class TeeHeadInit(ArrowHeadInit, LinePropsInit, total=False):
    ...

class TeeHead(ArrowHead, LineProps):
    ...

class VeeHeadInit(ArrowHeadInit, LinePropsInit, FillPropsInit, HatchPropsInit, total=False):
    ...

class VeeHead(ArrowHead, LineProps, FillProps, HatchProps):
    ...

class ArrowInit(DataAnnotationInit, BodyLinePropsInit, total=False):
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
