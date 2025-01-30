#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..._types import NumberSpec
from ...core.enums import CoordinateUnitsType as CoordinateUnits
from ...core.has_props import abstract
from ...core.property_mixins import BodyLineProps, FillProps, LineProps
from ..graphics import Marking
from .annotation import DataAnnotation

@abstract
@dataclass(init=False)
class ArrowHead(Marking):

    size: NumberSpec = ...

@dataclass
class OpenHead(ArrowHead, LineProps):
    ...

@dataclass
class NormalHead(ArrowHead, LineProps, FillProps):
    ...

@dataclass
class TeeHead(ArrowHead, LineProps):
    ...

@dataclass
class VeeHead(ArrowHead, LineProps, FillProps):
    ...

@dataclass
class Arrow(DataAnnotation, BodyLineProps):

    x_start: NumberSpec = ...

    y_start: NumberSpec = ...

    start_units: CoordinateUnits = ...

    start: ArrowHead | None = ...

    x_end: NumberSpec = ...

    y_end: NumberSpec = ...

    end_units: CoordinateUnits = ...

    end: ArrowHead | None = ...
