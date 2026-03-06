#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...._specs import (
    AngleSpec,
    ColorSpec,
    FloatSpec,
    NullStringSpec,
    NumberSpec,
)
from ...._types import (
    Alpha,
    Angle,
    Color,
    CoordinateLike,
    FontSize,
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
    AlphaSpec,
    BackgroundFillProps,
    BorderLineProps,
    DashPatternSpec,
    DashPatternType as DashPattern,
    IntSpec,
    LineCapSpec,
    LineCapType as LineCap,
    LineJoinSpec,
    LineJoinType as LineJoin,
    ScalarBackgroundFillProps,
    ScalarBackgroundHatchProps,
    ScalarBorderLineProps,
    ScalarTextProps,
    Size,
    TextBaselineType as TextBaseline,
    _BackgroundFillPropsInit,
    _BorderLinePropsInit,
    _ScalarBackgroundFillPropsInit,
    _ScalarBackgroundHatchPropsInit,
    _ScalarBorderLinePropsInit,
    _ScalarTextPropsInit,
)
from .html_annotation import (
    HTMLAnnotation,
    HTMLDataAnnotation,
    _HTMLAnnotationInit,
    _HTMLDataAnnotationInit,
)
from ....model.model import JSEventCallback
from ...coordinates import CoordinateMapping
from ...textures import Texture
from ...dom import (
    DOMNode,
    RendererGroup,
)
from ...renderers.renderer import (
    Renderer,
    RenderLevelType as RenderLevel,
)
from ...ui.tooltips import UIElement
from ...ui.ui_element import (Menu, Node, StyleSheet, Styles)

# class _HTMLTextAnnotationInit(_HTMLAnnotationInit, _ScalarBackgroundFillPropsInit, _ScalarBackgroundHatchPropsInit, _ScalarBorderLinePropsInit, total=False):
#     padding: Padding
#     border_radius: BorderRadius

class _HTMLTextAnnotationInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    html_attributes: dict[str, str]
    html_id: str | None
    css_classes: Sequence[str]
    css_variables: dict[str, str | Node]
    styles: dict[str, str | None] | Styles
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]]
    level: RenderLevel
    visible: bool
    coordinates: CoordinateMapping | None
    x_range_name: str
    y_range_name: str
    group: RendererGroup | None
    propagate_hover: bool
    context_menu: Menu | None
    renderers: list[Renderer]
    elements: list[UIElement | DOMNode]
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    padding: Padding
    border_radius: BorderRadius

class HTMLTextAnnotation(HTMLAnnotation, ScalarBackgroundFillProps, ScalarBackgroundHatchProps, ScalarBorderLineProps):
    def __init__(self, **kwargs: Unpack[_HTMLTextAnnotationInit]) -> None: ...

    padding: Padding = ...
    border_radius: BorderRadius = ...

# class _HTMLLabelInit(_HTMLTextAnnotationInit, _ScalarTextPropsInit, total=False):
#     x: CoordinateLike
#     x_units: CoordinateUnits
#     y: CoordinateLike
#     y_units: CoordinateUnits
#     text: str
#     angle: Angle
#     angle_units: AngleUnits
#     x_offset: float
#     y_offset: float

class _HTMLLabelInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    html_attributes: dict[str, str]
    html_id: str | None
    css_classes: Sequence[str]
    css_variables: dict[str, str | Node]
    styles: dict[str, str | None] | Styles
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]]
    level: RenderLevel
    visible: bool
    coordinates: CoordinateMapping | None
    x_range_name: str
    y_range_name: str
    group: RendererGroup | None
    propagate_hover: bool
    context_menu: Menu | None
    renderers: list[Renderer]
    elements: list[UIElement | DOMNode]
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    padding: Padding
    border_radius: BorderRadius
    text_color: Color | None
    text_outline_color: Color | None
    text_outline_width: float
    text_alpha: Alpha
    text_font: str
    text_font_size: FontSize
    text_font_style: FontStyle
    text_align: TextAlign
    text_baseline: TextBaseline
    text_line_height: float
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

# class _HTMLLabelSetInit(_HTMLDataAnnotationInit, _BackgroundFillPropsInit, _BorderLinePropsInit, total=False):
#     x: NumberSpec
#     x_units: CoordinateUnits
#     y: NumberSpec
#     y_units: CoordinateUnits
#     text: NullStringSpec
#     angle: AngleSpec
#     x_offset: NumberSpec
#     y_offset: NumberSpec

class _HTMLLabelSetInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    html_attributes: dict[str, str]
    html_id: str | None
    css_classes: Sequence[str]
    css_variables: dict[str, str | Node]
    styles: dict[str, str | None] | Styles
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]]
    level: RenderLevel
    visible: bool
    coordinates: CoordinateMapping | None
    x_range_name: str
    y_range_name: str
    group: RendererGroup | None
    propagate_hover: bool
    context_menu: Menu | None
    renderers: list[Renderer]
    elements: list[UIElement | DOMNode]
    background_fill_color: ColorSpec
    background_fill_alpha: AlphaSpec
    border_line_color: ColorSpec
    border_line_alpha: AlphaSpec
    border_line_width: FloatSpec
    border_line_join: LineJoinSpec
    border_line_cap: LineCapSpec
    border_line_dash: DashPatternSpec
    border_line_dash_offset: IntSpec
    x: NumberSpec
    x_units: CoordinateUnits
    y: NumberSpec
    y_units: CoordinateUnits
    text: NullStringSpec
    angle: AngleSpec
    x_offset: NumberSpec
    y_offset: NumberSpec

class HTMLLabelSet(HTMLDataAnnotation, BackgroundFillProps, BorderLineProps):
    def __init__(self, **kwargs: Unpack[_HTMLLabelSetInit]) -> None: ...

    x: NumberSpec = ...
    x_units: CoordinateUnits = ...
    y: NumberSpec = ...
    y_units: CoordinateUnits = ...
    text: NullStringSpec = ...
    angle: AngleSpec = ...
    x_offset: NumberSpec = ...
    y_offset: NumberSpec = ...

# class _HTMLTitleInit(_HTMLTextAnnotationInit, total=False):
#     text: str
#     vertical_align: VerticalAlign
#     align: TextAlign
#     text_line_height: float
#     offset: float
#     standoff: float
#     text_font: str
#     text_font_size: str
#     text_font_style: FontStyle
#     text_color: Color
#     text_outline_color: Color | None
#     text_outline_width: float
#     text_alpha: Alpha

class _HTMLTitleInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    html_attributes: dict[str, str]
    html_id: str | None
    css_classes: Sequence[str]
    css_variables: dict[str, str | Node]
    styles: dict[str, str | None] | Styles
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]]
    level: RenderLevel
    visible: bool
    coordinates: CoordinateMapping | None
    x_range_name: str
    y_range_name: str
    group: RendererGroup | None
    propagate_hover: bool
    context_menu: Menu | None
    renderers: list[Renderer]
    elements: list[UIElement | DOMNode]
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    padding: Padding
    border_radius: BorderRadius
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
