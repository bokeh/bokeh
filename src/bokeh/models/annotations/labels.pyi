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
    BackgroundHatchProps,
    BorderLineProps,
    ScalarBackgroundFillProps,
    ScalarBackgroundHatchProps,
    ScalarBorderLineProps,
    ScalarTextProps,
    TextProps,
    _BackgroundFillPropsInit,
    _BackgroundHatchPropsInit,
    _BorderLinePropsInit,
    _ScalarBackgroundFillPropsInit,
    _ScalarBackgroundHatchPropsInit,
    _ScalarBorderLinePropsInit,
    _ScalarTextPropsInit,
    _TextPropsInit,
)
from .annotation import (
    Annotation,
    DataAnnotation,
    _AnnotationInit,
    _DataAnnotationInit,
)

class _TextAnnotationInit(_AnnotationInit, _ScalarTextPropsInit, _ScalarBackgroundFillPropsInit,
        _ScalarBackgroundHatchPropsInit, _ScalarBorderLinePropsInit, total=False):
    text: TextLike
    padding: Padding
    border_radius: BorderRadius

class TextAnnotation(Annotation, ScalarTextProps, ScalarBackgroundFillProps,
        ScalarBackgroundHatchProps, ScalarBorderLineProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TextAnnotationInit]) -> None: ...

    text: TextLike = ...
    padding: Padding = ...
    border_radius: BorderRadius = ...

class _LabelInit(_TextAnnotationInit, total=False):
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
    def __init__(self, **kwargs: Unpack[_LabelInit]) -> None: ...

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

class _LabelSetInit(_DataAnnotationInit, _TextPropsInit, _BackgroundFillPropsInit, _BackgroundHatchPropsInit, _BorderLinePropsInit, total=False):
    x: NumberSpec
    x_units: CoordinateUnits
    y: NumberSpec
    y_units: CoordinateUnits
    text: NullStringSpec
    angle: AngleSpec
    x_offset: NumberSpec
    y_offset: NumberSpec

class LabelSet(DataAnnotation, TextProps, BackgroundFillProps, BackgroundHatchProps, BorderLineProps):
    def __init__(self, **kwargs: Unpack[_LabelSetInit]) -> None: ...

    x: NumberSpec = ...
    x_units: CoordinateUnits = ...
    y: NumberSpec = ...
    y_units: CoordinateUnits = ...
    text: NullStringSpec = ...
    angle: AngleSpec = ...
    x_offset: NumberSpec = ...
    y_offset: NumberSpec = ...

class _TitleInit(_TextAnnotationInit, total=False):
    vertical_align: VerticalAlign
    align: TextAlign
    standoff: float

class Title(TextAnnotation):
    def __init__(self, **kwargs: Unpack[_TitleInit]) -> None: ...

    vertical_align: VerticalAlign = ...
    align: TextAlign = ...
    standoff: float = ...
