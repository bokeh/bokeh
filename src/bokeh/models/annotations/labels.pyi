#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

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
)
from .annotation import (
    Annotation,
    DataAnnotation,
)

from ..._specs import AlphaSpec
from ..._specs import ColorSpec
from ..._specs import DashPatternSpec
from ..._specs import FloatSpec
from ..._specs import FontSizeSpec
from ..._specs import FontStyleSpec
from ..._specs import HatchPatternSpec
from ..._specs import IntSpec
from ..._specs import LineCapSpec
from ..._specs import LineJoinSpec
from ..._specs import StringSpec
from ..._specs import TextAlignSpec
from ..._specs import TextBaselineSpec
from ..._types import Alpha
from ..._types import Color
from ..._types import FontSize
from ..._types import Size
from ...core.enums import FontStyleType as FontStyle
from ...core.enums import LineCapType as LineCap
from ...core.enums import LineJoinType as LineJoin
from ...core.enums import RenderLevelType as RenderLevel
from ...core.enums import TextBaselineType as TextBaseline
from ...core.property.visual import DashPatternType as DashPattern
from ...model.model import JSEventCallback
from ..coordinates import CoordinateMapping
from ..css import StyleSheet
from ..css import Styles
from ..dom import DOMNode
from ..nodes import Node
from ..renderers.renderer import Renderer
from ..renderers.renderer import RendererGroup
from ..sources import DataSource
from ..textures import Texture
from ..ui.menus import Menu
from ..ui.ui_element import UIElement
from typing import Any
from typing import Sequence
from typing import TypedDict

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
