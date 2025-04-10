#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

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
    BorderLineProps,
    ScalarBackgroundFillProps,
    ScalarBackgroundHatchProps,
    ScalarBorderLineProps,
    ScalarTextProps,
)
from ..annotation import DataAnnotation
from .html_annotation import HTMLAnnotation

@dataclass
class HTMLTextAnnotation(HTMLAnnotation, ScalarBackgroundFillProps, ScalarBackgroundHatchProps, ScalarBorderLineProps):

    padding: Padding = ...

    border_radius: BorderRadius = ...

@dataclass
class HTMLLabel(HTMLTextAnnotation, ScalarTextProps):

    x: CoordinateLike = ...

    x_units: CoordinateUnits = ...

    y: CoordinateLike = ...

    y_units: CoordinateUnits = ...

    text: str = ...

    angle: Angle = ...

    angle_units: AngleUnits = ...

    x_offset: float = ...

    y_offset: float = ...

@dataclass
class HTMLLabelSet(HTMLAnnotation, DataAnnotation, BackgroundFillProps, BorderLineProps):

    x: NumberSpec = ...

    x_units: CoordinateUnits = ...

    y: NumberSpec = ...

    y_units: CoordinateUnits = ...

    text: NullStringSpec = ...

    angle: AngleSpec = ...

    x_offset: NumberSpec = ...

    y_offset: NumberSpec = ...

@dataclass
class HTMLTitle(HTMLTextAnnotation):

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

    text_alpha: Alpha = ...
