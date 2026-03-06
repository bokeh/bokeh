#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..._specs import AngleSpec, NullStringSpec, NumberSpec
from ..._types import Angle, Coordinate, TextLike
from ...core.enums import (
    AngleUnitsType as AngleUnits,
    CoordinateUnitsType as CoordinateUnits,
    DirectionType as Direction,
    TextAlignType as TextAlign,
    VerticalAlignType as VerticalAlign,
)
from ...core.has_props import abstract
from ...core.property_aliases import BorderRadius, Padding, TextAnchor
from ...core.property_mixins import (
    BackgroundFillProps,
    BackgroundHatchProps,
    BorderLineProps,
    ScalarBackgroundFillProps,
    ScalarBackgroundHatchProps,
    ScalarBorderLineProps,
    ScalarTextProps,
    TextProps,
)
from .annotation import Annotation, DataAnnotation

@abstract
@dataclass(init=False)
class TextAnnotation(Annotation, ScalarTextProps, ScalarBackgroundFillProps, ScalarBackgroundHatchProps, ScalarBorderLineProps):

    text: TextLike = ...

    padding: Padding = ...

    border_radius: BorderRadius = ...

@dataclass
class Label(TextAnnotation):

    anchor: TextAnchor = ...

    x: Coordinate = ...

    y: Coordinate = ...

    x_units: CoordinateUnits = ...

    y_units: CoordinateUnits = ...

    x_offset: float = ...

    y_offset: float = ...

    angle: Angle = ...

    angle_units: AngleUnits = ...

    direction: Direction = ...

    editable: bool = ...

@dataclass
class LabelSet(DataAnnotation, TextProps, BackgroundFillProps, BackgroundHatchProps, BorderLineProps):

    x: NumberSpec = ...

    x_units: CoordinateUnits = ...

    y: NumberSpec = ...

    y_units: CoordinateUnits = ...

    text: NullStringSpec = ...

    angle: AngleSpec = ...

    x_offset: NumberSpec = ...

    y_offset: NumberSpec = ...

@dataclass
class Title(TextAnnotation):

    vertical_align: VerticalAlign = ...

    align: TextAlign = ...

    standoff: float = ...
