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
from ..._specs import AngleSpec, NullStringSpec, NumberSpec
from ..._types import Angle, Coordinate, TextLike
from ...core.enums import (
    AngleUnitsType as AngleUnits,
    CoordinateUnitsType as CoordinateUnits,
    DirectionType as Direction,
    TextAlignType as TextAlign,
    VerticalAlignType as VerticalAlign,
)
from ...core.property_aliases import BorderRadius, Padding, TextAnchor
from ...core.property_mixins import (
    BackgroundFillProps,
    BackgroundFillPropsInit,
    BackgroundHatchProps,
    BackgroundHatchPropsInit,
    BorderLineProps,
    BorderLinePropsInit,
    ScalarBackgroundFillProps,
    ScalarBackgroundFillPropsInit,
    ScalarBackgroundHatchProps,
    ScalarBackgroundHatchPropsInit,
    ScalarBorderLineProps,
    ScalarBorderLinePropsInit,
    ScalarTextProps,
    ScalarTextPropsInit,
    TextProps,
    TextPropsInit,
)
from .annotation import (
    Annotation,
    AnnotationInit,
    DataAnnotation,
    DataAnnotationInit,
)

class TextAnnotationInit(AnnotationInit, ScalarTextPropsInit, ScalarBackgroundFillPropsInit, ScalarBackgroundHatchPropsInit, ScalarBorderLinePropsInit, total=False):
    text: TextLike
    padding: Padding
    border_radius: BorderRadius

class TextAnnotation(Annotation, ScalarTextProps, ScalarBackgroundFillProps, ScalarBackgroundHatchProps, ScalarBorderLineProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[TextAnnotationInit]) -> None: ...

    text: TextLike = ...
    padding: Padding = ...
    border_radius: BorderRadius = ...

class LabelInit(TextAnnotationInit, total=False):
    anchor: TextAnchor
    x: Coordinate
    y: Coordinate
    x_units: CoordinateUnits
    y_units: CoordinateUnits
    x_offset: float
    y_offset: float
    angle: Angle
    angle_units: AngleUnits
    direction: Direction
    editable: bool

class Label(TextAnnotation):
    def __init__(self, **kwargs: Unpack[LabelInit]) -> None: ...

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

class LabelSetInit(DataAnnotationInit, TextPropsInit, BackgroundFillPropsInit, BackgroundHatchPropsInit, BorderLinePropsInit, total=False):
    x: NumberSpec
    x_units: CoordinateUnits
    y: NumberSpec
    y_units: CoordinateUnits
    text: NullStringSpec
    angle: AngleSpec
    x_offset: NumberSpec
    y_offset: NumberSpec

class LabelSet(DataAnnotation, TextProps, BackgroundFillProps, BackgroundHatchProps, BorderLineProps):
    def __init__(self, **kwargs: Unpack[LabelSetInit]) -> None: ...

    x: NumberSpec = ...
    x_units: CoordinateUnits = ...
    y: NumberSpec = ...
    y_units: CoordinateUnits = ...
    text: NullStringSpec = ...
    angle: AngleSpec = ...
    x_offset: NumberSpec = ...
    y_offset: NumberSpec = ...

class TitleInit(TextAnnotationInit, total=False):
    vertical_align: VerticalAlign
    align: TextAlign
    standoff: float

class Title(TextAnnotation):
    def __init__(self, **kwargs: Unpack[TitleInit]) -> None: ...

    vertical_align: VerticalAlign = ...
    align: TextAlign = ...
    standoff: float = ...
