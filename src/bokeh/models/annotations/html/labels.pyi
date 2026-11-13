#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from typing import Unpack

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
    ScalarBackgroundFillProps,
    ScalarBackgroundHatchProps,
    ScalarBorderLineProps,
    ScalarTextProps,
    _ScalarBackgroundFillPropsInit,
    _ScalarBackgroundHatchPropsInit,
    _ScalarBorderLinePropsInit,
    _ScalarTextPropsInit,
)
from .html_annotation import HTMLAnnotation, _HTMLAnnotationInit

class _HTMLTextAnnotationInit(_HTMLAnnotationInit, _ScalarBackgroundFillPropsInit, _ScalarBackgroundHatchPropsInit, _ScalarBorderLinePropsInit, total=False):
    padding: Padding
    border_radius: BorderRadius

class HTMLTextAnnotation(HTMLAnnotation, ScalarBackgroundFillProps, ScalarBackgroundHatchProps, ScalarBorderLineProps):
    def __init__(self, **kwargs: Unpack[_HTMLTextAnnotationInit]) -> None: ...

    padding: Padding = ...
    border_radius: BorderRadius = ...

class _HTMLLabelInit(_HTMLTextAnnotationInit, _ScalarTextPropsInit, total=False):
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
    def __init__(self, **kwargs: Unpack[_HTMLLabelInit]) -> None: ...

    x: CoordinateLike = ...
    x_units: CoordinateUnits = ...
    y: CoordinateLike = ...
    y_units: CoordinateUnits = ...
    text: str = ...
    angle: Angle = ...
    angle_units: AngleUnits = ...
    x_offset: float = ...
    y_offset: float = ...

class _HTMLTitleInit(_HTMLTextAnnotationInit, total=False):
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
    def __init__(self, **kwargs: Unpack[_HTMLTitleInit]) -> None: ...

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
