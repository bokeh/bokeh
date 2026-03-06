#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..._specs import (
    AngleSpec,
    ColorSpec,
    FloatSpec,
    FontStyleSpec,
    NullStringSpec,
    NumberSpec,
    StringSpec,
    TextAlignSpec,
)
from ..._types import (
    Alpha,
    Angle,
    Color,
    Coordinate,
    FontSize,
    TextLike,
)
from ...core.enums import (
    AngleUnitsType as AngleUnits,
    CoordinateUnitsType as CoordinateUnits,
    DirectionType as Direction,
    FontStyleType as FontStyle,
    TextAlignType as TextAlign,
    VerticalAlignType as VerticalAlign,
)
from ...core.property_aliases import BorderRadius, Padding, TextAnchor
from ...core.property_mixins import (
    AlphaSpec,
    BackgroundFillProps,
    BackgroundHatchProps,
    BorderLineProps,
    DashPatternSpec,
    DashPatternType as DashPattern,
    FontSizeSpec,
    HatchPatternSpec,
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
    TextBaselineSpec,
    TextBaselineType as TextBaseline,
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
from ...model.model import JSEventCallback
from ..coordinates import CoordinateMapping
from ..textures import Texture
from ..dom import (
    DOMNode,
    RendererGroup,
)
from ..renderers.renderer import (
    Renderer,
    RenderLevelType as RenderLevel,
)
from ..ui.tooltips import UIElement
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)
from ..sources import DataSource

# class _TextAnnotationInit(_AnnotationInit, _ScalarTextPropsInit, _ScalarBackgroundFillPropsInit,
#         _ScalarBackgroundHatchPropsInit, _ScalarBorderLinePropsInit, total=False):
#     text: TextLike
#     padding: Padding
#     border_radius: BorderRadius

class _TextAnnotationInit(TypedDict, total=False):
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

# class _LabelInit(_TextAnnotationInit, total=False):
#     anchor: TextAnchor
#     x: Coordinate
#     y: Coordinate
#     x_units: CoordinateUnits
#     y_units: CoordinateUnits
#     x_offset: float
#     y_offset: float
#     angle: Angle
#     angle_units: AngleUnits
#     direction: Direction
#     editable: bool

class _LabelInit(TypedDict, total=False):
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
    text: TextLike
    padding: Padding
    border_radius: BorderRadius
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

# class _LabelSetInit(_DataAnnotationInit, _TextPropsInit, _BackgroundFillPropsInit, _BackgroundHatchPropsInit, _BorderLinePropsInit, total=False):
#     x: NumberSpec
#     x_units: CoordinateUnits
#     y: NumberSpec
#     y_units: CoordinateUnits
#     text: NullStringSpec
#     angle: AngleSpec
#     x_offset: NumberSpec
#     y_offset: NumberSpec

class _LabelSetInit(TypedDict, total=False):
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
    source: DataSource
    text_color: ColorSpec
    text_outline_color: ColorSpec
    text_outline_width: FloatSpec
    text_alpha: AlphaSpec
    text_font: StringSpec
    text_font_size: FontSizeSpec
    text_font_style: FontStyleSpec
    text_align: TextAlignSpec
    text_baseline: TextBaselineSpec
    text_line_height: NumberSpec
    background_fill_color: ColorSpec
    background_fill_alpha: AlphaSpec
    background_hatch_color: ColorSpec
    background_hatch_alpha: AlphaSpec
    background_hatch_scale: FloatSpec
    background_hatch_pattern: HatchPatternSpec
    background_hatch_weight: FloatSpec
    background_hatch_extra: dict[str, Texture]
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

# class _TitleInit(_TextAnnotationInit, total=False):
#     vertical_align: VerticalAlign
#     align: TextAlign
#     standoff: float

class _TitleInit(TypedDict, total=False):
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
    text: TextLike
    padding: Padding
    border_radius: BorderRadius
    vertical_align: VerticalAlign
    align: TextAlign
    standoff: float

class Title(TextAnnotation):
    def __init__(self, **kwargs: Unpack[_TitleInit]) -> None: ...

    vertical_align: VerticalAlign = ...
    align: TextAlign = ...
    standoff: float = ...
