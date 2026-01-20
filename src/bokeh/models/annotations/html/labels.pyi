#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Unpack

# Bokeh imports
from ...._specs import AngleSpec, NullStringSpec, NumberSpec
from ...._types import (
    Alpha,
    Angle,
    Color,
    CoordinateLike,
)
from ....core.enums import (
    AngleUnitsType as AngleUnits,
    CoordinateUnitsType as CoordinateUnits,
    FontStyleType as FontStyle,
    TextAlignType as TextAlign,
    VerticalAlignType as VerticalAlign,
)
from ....core.property_aliases import BorderRadius, Padding
from ....core.property_mixins import (
    BackgroundFillProps,
    BackgroundFillPropsInit,
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
)
from ..annotation import DataAnnotation, DataAnnotationInit
from .html_annotation import HTMLAnnotation, HTMLAnnotationInit

class HTMLTextAnnotationInit(HTMLAnnotationInit, ScalarBackgroundFillPropsInit, ScalarBackgroundHatchPropsInit, ScalarBorderLinePropsInit, total=False):
    padding: Padding
    border_radius: BorderRadius

class HTMLTextAnnotation(HTMLAnnotation, ScalarBackgroundFillProps, ScalarBackgroundHatchProps, ScalarBorderLineProps):
    def __init__(self, **kwargs: Unpack[HTMLTextAnnotationInit]) -> None: ...

    padding: Padding = ...
    border_radius: BorderRadius = ...

class HTMLLabelInit(HTMLTextAnnotationInit, ScalarTextPropsInit, total=False):
    x: CoordinateLike
    x_units: CoordinateUnits
    y: CoordinateLike
    y_units: CoordinateUnits
    text: str
    angle: Angle
    angle_units: AngleUnits
    x_offset: float
    y_offset: float

class HTMLLabel(HTMLTextAnnotation, ScalarTextProps):
    def __init__(self, **kwargs: Unpack[HTMLLabelInit]) -> None: ...

    x: CoordinateLike = ...
    x_units: CoordinateUnits = ...
    y: CoordinateLike = ...
    y_units: CoordinateUnits = ...
    text: str = ...
    angle: Angle = ...
    angle_units: AngleUnits = ...
    x_offset: float = ...
    y_offset: float = ...

class HTMLLabelSetInit(HTMLAnnotationInit, DataAnnotationInit, BackgroundFillPropsInit, BorderLinePropsInit, total=False):
    x: NumberSpec
    x_units: CoordinateUnits
    y: NumberSpec
    y_units: CoordinateUnits
    text: NullStringSpec
    angle: AngleSpec
    x_offset: NumberSpec
    y_offset: NumberSpec

class HTMLLabelSet(HTMLAnnotation, DataAnnotation, BackgroundFillProps, BorderLineProps):
    def __init__(self, **kwargs: Unpack[HTMLLabelSetInit]) -> None: ...

    x: NumberSpec = ...
    x_units: CoordinateUnits = ...
    y: NumberSpec = ...
    y_units: CoordinateUnits = ...
    text: NullStringSpec = ...
    angle: AngleSpec = ...
    x_offset: NumberSpec = ...
    y_offset: NumberSpec = ...

class HTMLTitleInit(HTMLTextAnnotationInit, total=False):
    text: str
    vertical_align: VerticalAlign
    align: TextAlign
    text_line_height: float
    offset: float
    standoff: float
    text_font: str
    text_font_size: str
    text_font_style: FontStyle
    text_color: Color
    text_outline_color: Color | None
    text_outline_width: float
    text_alpha: Alpha

class HTMLTitle(HTMLTextAnnotation):
    def __init__(self, **kwargs: Unpack[HTMLTitleInit]) -> None: ...

    text: str = ...
    vertical_align: VerticalAlign = ...
    align: TextAlign = ...
    text_line_height: float = ...
    offset: float = ...
    standoff: float = ...
    text_font: str = ...
    text_font_size: str = ...
    text_font_style: FontStyle = ...
    text_color: Color = ...
    text_outline_color: Color | None = ...
    text_outline_width: float = ...
    text_alpha: Alpha = ...
