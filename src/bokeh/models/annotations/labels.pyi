#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from abc import abstractmethod
from typing import Unpack

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
    ScalarBackgroundFillProps,
    ScalarBackgroundHatchProps,
    ScalarBorderLineProps,
    ScalarTextProps,
    _ScalarBackgroundFillPropsInit,
    _ScalarBackgroundHatchPropsInit,
    _ScalarBorderLinePropsInit,
    _ScalarTextPropsInit,
)
from .annotation import (
    Annotation,
    _AnnotationInit,
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

class _TitleInit(_TextAnnotationInit, total=False):
    vertical_align: VerticalAlign
    align: TextAlign
    standoff: float

class Title(TextAnnotation):
    def __init__(self, **kwargs: Unpack[_TitleInit]) -> None: ...

    vertical_align: VerticalAlign = ...
    align: TextAlign = ...
    standoff: float = ...
