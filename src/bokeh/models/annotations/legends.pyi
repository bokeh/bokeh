#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import (
    Any,
    TYPE_CHECKING,
    Literal,
    Sequence,
    TypeAlias,
    TypedDict,
)

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..._specs import NullStringSpec
from ..._types import CoordinateLike, TextLike
from ...core.enums import (
    AlignType as Align,
    AlternationPolicyType as AlternationPolicy,
    AnchorType as HVAlign,
    AutoType as Auto,
    HAlignType as HAlign,
    LegendClickPolicyType as LegendClickPolicy,
    LegendLocationType as LegendLocation,
    LocationType as Location,
    OrientationType as Orientation,
    VAlignType as VAlign,
)
from ...core.property_aliases import AutoAnchor, BorderRadius, Padding
from ...core.property_mixins import (
    AlphaSpec,
    DashPatternSpec,
    DashPatternType as DashPattern,
    GlyphFillProps,
    GlyphHatchProps,
    GlyphLineProps,
    HatchPatternSpec,
    IntSpec,
    LineCapSpec,
    LineCapType as LineCap,
    LineJoinSpec,
    LineJoinType as LineJoin,
    ScalarBackgroundFillProps,
    ScalarBackgroundHatchProps,
    ScalarBarLineProps,
    ScalarBorderLineProps,
    ScalarInactiveFillProps,
    ScalarItemBackgroundFillProps,
    ScalarLabelTextProps,
    ScalarMajorLabelTextProps,
    ScalarMajorTickLineProps,
    ScalarMinorTickLineProps,
    ScalarTitleTextProps,
    Size,
    TextBaselineType as TextBaseline,
    _GlyphFillPropsInit,
    _GlyphHatchPropsInit,
    _GlyphLinePropsInit,
    _ScalarBackgroundFillPropsInit,
    _ScalarBackgroundHatchPropsInit,
    _ScalarBarLinePropsInit,
    _ScalarBorderLinePropsInit,
    _ScalarInactiveFillPropsInit,
    _ScalarItemBackgroundFillPropsInit,
    _ScalarLabelTextPropsInit,
    _ScalarMajorLabelTextPropsInit,
    _ScalarMajorTickLinePropsInit,
    _ScalarMinorTickLinePropsInit,
    _ScalarTitleTextPropsInit,
)
from ...model.model import JSEventCallback, Model, _ModelInit
from ...util.callback_manager import EventCallback as PyEventCallback
from ..callbacks import Callback as JsEventCallback
from ..formatters import TickFormatter
from ..glyph import Glyph, RadialGlyph
from ..labeling import LabelingPolicy
from ..mappers import ColorMapper
from ..ranges import Range
from ..renderers import GlyphRenderer
from ..tickers import Ticker
from .annotation import Annotation, _AnnotationInit
from .dimensional import Dimensional
from ...plotting.glyph_api import (Color, CoordinateMapping, Texture)
from ..dom import RendererGroup
from ..glyphs import FloatSpec
from ..renderers.renderer import RenderLevelType as RenderLevel
from ..renderers.tile_renderer import Renderer
from ..tools import Alpha
from ..ui.icons import FontSize
from ..ui.tooltips import UIElement
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)
from ..widgets.buttons import DOMNode
from ..widgets.indicators import max
from ..widgets.tables import ColorSpec
from .html.labels import FontStyleType as FontStyle
from .labels import TextAlignType as TextAlign

# class _BaseColorBarInit(_AnnotationInit, _ScalarTitleTextPropsInit, _ScalarMajorLabelTextPropsInit, _ScalarMajorTickLinePropsInit,
#         _ScalarMinorTickLinePropsInit, _ScalarBarLinePropsInit, _ScalarBorderLinePropsInit, _ScalarBackgroundFillPropsInit, total=False):
#     location: HVAlign | tuple[float, float]
#     orientation: Orientation | Auto
#     height: Auto | int
#     width: Auto | int
#     title: TextLike | None
#     title_standoff: int
#     ticker: Ticker | Auto
#     formatter: TickFormatter | Auto
#     major_label_overrides: dict[float | str, TextLike]
#     major_label_policy: LabelingPolicy
#     margin: int
#     padding: int
#     label_standoff: int
#     major_tick_in: int
#     major_tick_out: int
#     minor_tick_in: int
#     minor_tick_out: int

class _BaseColorBarInit(TypedDict, total=False):
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
    title_text_color: Color | None
    title_text_outline_color: Color | None
    title_text_outline_width: float
    title_text_alpha: Alpha
    title_text_font: str
    title_text_font_size: FontSize
    title_text_font_style: FontStyle
    title_text_align: TextAlign
    title_text_baseline: TextBaseline
    title_text_line_height: float
    major_label_text_color: Color | None
    major_label_text_outline_color: Color | None
    major_label_text_outline_width: float
    major_label_text_alpha: Alpha
    major_label_text_font: str
    major_label_text_font_size: FontSize
    major_label_text_font_style: FontStyle
    major_label_text_align: TextAlign
    major_label_text_baseline: TextBaseline
    major_label_text_line_height: float
    major_tick_line_color: Color | None
    major_tick_line_alpha: Alpha
    major_tick_line_width: float
    major_tick_line_join: LineJoin
    major_tick_line_cap: LineCap
    major_tick_line_dash: DashPattern
    major_tick_line_dash_offset: int
    minor_tick_line_color: Color | None
    minor_tick_line_alpha: Alpha
    minor_tick_line_width: float
    minor_tick_line_join: LineJoin
    minor_tick_line_cap: LineCap
    minor_tick_line_dash: DashPattern
    minor_tick_line_dash_offset: int
    bar_line_color: Color | None
    bar_line_alpha: Alpha
    bar_line_width: float
    bar_line_join: LineJoin
    bar_line_cap: LineCap
    bar_line_dash: DashPattern
    bar_line_dash_offset: int
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    location: HVAlign | tuple[float, float]
    orientation: Orientation | Auto
    height: Auto | int
    width: Auto | int
    title: TextLike | None
    title_standoff: int
    ticker: Ticker | Auto
    formatter: TickFormatter | Auto
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    margin: int
    padding: int
    label_standoff: int
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int

class BaseColorBar(Annotation, ScalarTitleTextProps, ScalarMajorLabelTextProps, ScalarMajorTickLineProps,
        ScalarMinorTickLineProps, ScalarBarLineProps, ScalarBorderLineProps, ScalarBackgroundFillProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_BaseColorBarInit]) -> None: ...

    location: HVAlign | tuple[float, float] = ...
    orientation: Orientation | Auto = ...
    height: Auto | int = ...
    width: Auto | int = ...
    title: TextLike | None = ...
    title_standoff: int = ...
    ticker: Ticker | Auto = ...
    formatter: TickFormatter | Auto = ...
    major_label_overrides: dict[float | str, TextLike] = ...
    major_label_policy: LabelingPolicy = ...
    margin: int = ...
    padding: int = ...
    label_standoff: int = ...
    major_tick_in: int = ...
    major_tick_out: int = ...
    minor_tick_in: int = ...
    minor_tick_out: int = ...

# class _ColorBarInit(_BaseColorBarInit, total=False):
#     color_mapper: ColorMapper
#     display_low: float | None
#     display_high: float | None
#     scale_alpha: float

class _ColorBarInit(TypedDict, total=False):
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
    title_text_color: Color | None
    title_text_outline_color: Color | None
    title_text_outline_width: float
    title_text_alpha: Alpha
    title_text_font: str
    title_text_font_size: FontSize
    title_text_font_style: FontStyle
    title_text_align: TextAlign
    title_text_baseline: TextBaseline
    title_text_line_height: float
    major_label_text_color: Color | None
    major_label_text_outline_color: Color | None
    major_label_text_outline_width: float
    major_label_text_alpha: Alpha
    major_label_text_font: str
    major_label_text_font_size: FontSize
    major_label_text_font_style: FontStyle
    major_label_text_align: TextAlign
    major_label_text_baseline: TextBaseline
    major_label_text_line_height: float
    major_tick_line_color: Color | None
    major_tick_line_alpha: Alpha
    major_tick_line_width: float
    major_tick_line_join: LineJoin
    major_tick_line_cap: LineCap
    major_tick_line_dash: DashPattern
    major_tick_line_dash_offset: int
    minor_tick_line_color: Color | None
    minor_tick_line_alpha: Alpha
    minor_tick_line_width: float
    minor_tick_line_join: LineJoin
    minor_tick_line_cap: LineCap
    minor_tick_line_dash: DashPattern
    minor_tick_line_dash_offset: int
    bar_line_color: Color | None
    bar_line_alpha: Alpha
    bar_line_width: float
    bar_line_join: LineJoin
    bar_line_cap: LineCap
    bar_line_dash: DashPattern
    bar_line_dash_offset: int
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    location: HVAlign | tuple[float, float]
    orientation: Orientation | Auto
    height: Auto | int
    width: Auto | int
    title: TextLike | None
    title_standoff: int
    ticker: Ticker | Auto
    formatter: TickFormatter | Auto
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    margin: int
    padding: int
    label_standoff: int
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    color_mapper: ColorMapper
    display_low: float | None
    display_high: float | None
    scale_alpha: float

class ColorBar(BaseColorBar):
    def __init__(self, **kwargs: Unpack[_ColorBarInit]) -> None: ...

    color_mapper: ColorMapper = ...
    display_low: float | None = ...
    display_high: float | None = ...
    scale_alpha: float = ...

# class _ContourColorBarInit(_BaseColorBarInit, total=False):
#     fill_renderer: GlyphRenderer[Glyph]
#     line_renderer: GlyphRenderer[Glyph]
#     levels: Sequence[float]

class _ContourColorBarInit(TypedDict, total=False):
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
    title_text_color: Color | None
    title_text_outline_color: Color | None
    title_text_outline_width: float
    title_text_alpha: Alpha
    title_text_font: str
    title_text_font_size: FontSize
    title_text_font_style: FontStyle
    title_text_align: TextAlign
    title_text_baseline: TextBaseline
    title_text_line_height: float
    major_label_text_color: Color | None
    major_label_text_outline_color: Color | None
    major_label_text_outline_width: float
    major_label_text_alpha: Alpha
    major_label_text_font: str
    major_label_text_font_size: FontSize
    major_label_text_font_style: FontStyle
    major_label_text_align: TextAlign
    major_label_text_baseline: TextBaseline
    major_label_text_line_height: float
    major_tick_line_color: Color | None
    major_tick_line_alpha: Alpha
    major_tick_line_width: float
    major_tick_line_join: LineJoin
    major_tick_line_cap: LineCap
    major_tick_line_dash: DashPattern
    major_tick_line_dash_offset: int
    minor_tick_line_color: Color | None
    minor_tick_line_alpha: Alpha
    minor_tick_line_width: float
    minor_tick_line_join: LineJoin
    minor_tick_line_cap: LineCap
    minor_tick_line_dash: DashPattern
    minor_tick_line_dash_offset: int
    bar_line_color: Color | None
    bar_line_alpha: Alpha
    bar_line_width: float
    bar_line_join: LineJoin
    bar_line_cap: LineCap
    bar_line_dash: DashPattern
    bar_line_dash_offset: int
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    location: HVAlign | tuple[float, float]
    orientation: Orientation | Auto
    height: Auto | int
    width: Auto | int
    title: TextLike | None
    title_standoff: int
    ticker: Ticker | Auto
    formatter: TickFormatter | Auto
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    margin: int
    padding: int
    label_standoff: int
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    fill_renderer: GlyphRenderer[Glyph]
    line_renderer: GlyphRenderer[Glyph]
    levels: Sequence[float]

class ContourColorBar(BaseColorBar):
    def __init__(self, **kwargs: Unpack[_ContourColorBarInit]) -> None: ...

    fill_renderer: GlyphRenderer[Glyph] = ...
    line_renderer: GlyphRenderer[Glyph] = ...
    levels: Sequence[float] = ...

# class _LegendItemInit(_ModelInit, total=False):
#     label: NullStringSpec
#     renderers: list[GlyphRenderer[Glyph]]
#     index: int | None
#     visible: bool

class _LegendItemInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    label: NullStringSpec
    renderers: list[GlyphRenderer[Glyph]]
    index: int | None
    visible: bool

class LegendItem(Model):
    def __init__(self, **kwargs: Unpack[_LegendItemInit]) -> None: ...

    label: NullStringSpec = ...
    renderers: list[GlyphRenderer[Glyph]] = ...
    index: int | None = ...
    visible: bool = ...

# class _LegendInit(_AnnotationInit, _ScalarTitleTextPropsInit, _ScalarBorderLinePropsInit, _ScalarBackgroundFillPropsInit,
#         _ScalarItemBackgroundFillPropsInit, _ScalarInactiveFillPropsInit, _ScalarLabelTextPropsInit, total=False):
#     location: LegendLocation | tuple[float, float]
#     orientation: Orientation
#     ncols: int | Auto
#     nrows: int | Auto
#     title: str | None
#     title_location: Location
#     title_standoff: int
#     click_policy: LegendClickPolicy
#     item_background_policy: AlternationPolicy
#     label_standoff: int
#     label_height: Auto | int
#     label_width: int
#     glyph_height: int
#     glyph_width: int
#     margin: int
#     padding: Padding
#     border_radius: BorderRadius
#     spacing: int
#     items: list[LegendItem] | list[tuple[str, list[GlyphRenderer[Glyph]]]]

class _LegendInit(TypedDict, total=False):
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
    title_text_color: Color | None
    title_text_outline_color: Color | None
    title_text_outline_width: float
    title_text_alpha: Alpha
    title_text_font: str
    title_text_font_size: FontSize
    title_text_font_style: FontStyle
    title_text_align: TextAlign
    title_text_baseline: TextBaseline
    title_text_line_height: float
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    item_background_fill_color: Color | None
    item_background_fill_alpha: Alpha
    inactive_fill_color: Color | None
    inactive_fill_alpha: Alpha
    label_text_color: Color | None
    label_text_outline_color: Color | None
    label_text_outline_width: float
    label_text_alpha: Alpha
    label_text_font: str
    label_text_font_size: FontSize
    label_text_font_style: FontStyle
    label_text_align: TextAlign
    label_text_baseline: TextBaseline
    label_text_line_height: float
    location: LegendLocation | tuple[float, float]
    orientation: Orientation
    ncols: int | Auto
    nrows: int | Auto
    title: str | None
    title_location: Location
    title_standoff: int
    click_policy: LegendClickPolicy
    item_background_policy: AlternationPolicy
    label_standoff: int
    label_height: Auto | int
    label_width: int
    glyph_height: int
    glyph_width: int
    margin: int
    padding: Padding
    border_radius: BorderRadius
    spacing: int
    items: list[LegendItem] | list[tuple[str, list[GlyphRenderer[Glyph]]]]

class Legend(Annotation, ScalarTitleTextProps, ScalarBorderLineProps, ScalarBackgroundFillProps,
        ScalarItemBackgroundFillProps, ScalarInactiveFillProps, ScalarLabelTextProps):
    def __init__(self, **kwargs: Unpack[_LegendInit]) -> None: ...

    location: LegendLocation | tuple[float, float] = ...
    orientation: Orientation = ...
    ncols: int | Auto = ...
    nrows: int | Auto = ...
    title: str | None = ...
    title_location: Location = ...
    title_standoff: int = ...
    click_policy: LegendClickPolicy = ...
    item_background_policy: AlternationPolicy = ...
    label_standoff: int = ...
    label_height: Auto | int = ...
    label_width: int = ...
    glyph_height: int = ...
    glyph_width: int = ...
    margin: int = ...
    padding: Padding = ...
    border_radius: BorderRadius = ...
    spacing: int = ...

    @property
    def items(self) -> list[LegendItem]: ...
    @items.setter
    def items(self, items: list[LegendItem] | list[tuple[str, list[GlyphRenderer[Glyph]]]]) -> None: ...

    def on_click(self, handler: PyEventCallback) -> None: ...

    def js_on_click(self, handler: JsEventCallback) -> None: ...

X: TypeAlias = HAlign | float | CoordinateLike
Y: TypeAlias = VAlign | float | CoordinateLike

Position: TypeAlias = HVAlign | tuple[X, Y]
PositionUnits: TypeAlias = Literal["data", "screen", "view", "percent"]

# class _ScaleBarInit(_AnnotationInit, _ScalarBarLinePropsInit, _ScalarLabelTextPropsInit, _ScalarTitleTextPropsInit,
#         _ScalarBorderLinePropsInit, _ScalarBackgroundFillPropsInit, _ScalarBackgroundHatchPropsInit, total=False):
#     range: Range | Auto
#     unit: str
#     dimensional: Dimensional
#     orientation: Orientation
#     location: Position
#     x_units: PositionUnits
#     y_units: PositionUnits
#     anchor: AutoAnchor
#     length_sizing: Literal["adaptive", "exact"]
#     bar_length: float | int
#     bar_length_units: Literal["screen", "data", "percent"]
#     margin: int
#     padding: int
#     label: str
#     label_align: Align
#     label_location: Location
#     label_standoff: int
#     title: str
#     title_align: Align
#     title_location: Location
#     title_standoff: int
#     ticker: Ticker

class _ScaleBarInit(TypedDict, total=False):
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
    bar_line_color: Color | None
    bar_line_alpha: Alpha
    bar_line_width: float
    bar_line_join: LineJoin
    bar_line_cap: LineCap
    bar_line_dash: DashPattern
    bar_line_dash_offset: int
    label_text_color: Color | None
    label_text_outline_color: Color | None
    label_text_outline_width: float
    label_text_alpha: Alpha
    label_text_font: str
    label_text_font_size: FontSize
    label_text_font_style: FontStyle
    label_text_align: TextAlign
    label_text_baseline: TextBaseline
    label_text_line_height: float
    title_text_color: Color | None
    title_text_outline_color: Color | None
    title_text_outline_width: float
    title_text_alpha: Alpha
    title_text_font: str
    title_text_font_size: FontSize
    title_text_font_style: FontStyle
    title_text_align: TextAlign
    title_text_baseline: TextBaseline
    title_text_line_height: float
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    range: Range | Auto
    unit: str
    dimensional: Dimensional
    orientation: Orientation
    location: Position
    x_units: PositionUnits
    y_units: PositionUnits
    anchor: AutoAnchor
    length_sizing: Literal["adaptive", "exact"]
    bar_length: float | int
    bar_length_units: Literal["screen", "data", "percent"]
    margin: int
    padding: int
    label: str
    label_align: Align
    label_location: Location
    label_standoff: int
    title: str
    title_align: Align
    title_location: Location
    title_standoff: int
    ticker: Ticker

class ScaleBar(Annotation, ScalarBarLineProps, ScalarLabelTextProps, ScalarTitleTextProps,
        ScalarBorderLineProps, ScalarBackgroundFillProps, ScalarBackgroundHatchProps):
    def __init__(self, **kwargs: Unpack[_ScaleBarInit]) -> None: ...

    range: Range | Auto = ...
    unit: str = ...
    dimensional: Dimensional = ...
    orientation: Orientation = ...
    location: Position = ...
    x_units: PositionUnits = ...
    y_units: PositionUnits = ...
    anchor: AutoAnchor = ...
    length_sizing: Literal["adaptive", "exact"] = ...
    bar_length: float | int = ...
    bar_length_units: Literal["screen", "data", "percent"] = ...
    margin: int = ...
    padding: int = ...
    label: str = ...
    label_align: Align = ...
    label_location: Location = ...
    label_standoff: int = ...
    title: str = ...
    title_align: Align = ...
    title_location: Location = ...
    title_standoff: int = ...
    ticker: Ticker = ...

# class _BaseBarInit(_AnnotationInit, _ScalarTitleTextPropsInit, _ScalarMajorLabelTextPropsInit, _ScalarMajorTickLinePropsInit,
#         _ScalarMinorTickLinePropsInit, _ScalarBarLinePropsInit, _ScalarBorderLinePropsInit, _ScalarBackgroundFillPropsInit, total=False):
#     location: HVAlign | tuple[float, float]
#     orientation: Orientation | Auto
#     height: Literal["max"] | int
#     width: Literal["max"] | int
#     margin: int
#     padding: int
#     title: TextLike | None
#     title_standoff: int
#     ticker: Ticker | Auto
#     formatter: TickFormatter | Auto
#     major_label_overrides: dict[float | str, TextLike]
#     major_label_policy: LabelingPolicy
#     label_standoff: int
#     major_tick_in: int
#     major_tick_out: int
#     minor_tick_in: int
#     minor_tick_out: int

class _BaseBarInit(TypedDict, total=False):
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
    title_text_color: Color | None
    title_text_outline_color: Color | None
    title_text_outline_width: float
    title_text_alpha: Alpha
    title_text_font: str
    title_text_font_size: FontSize
    title_text_font_style: FontStyle
    title_text_align: TextAlign
    title_text_baseline: TextBaseline
    title_text_line_height: float
    major_label_text_color: Color | None
    major_label_text_outline_color: Color | None
    major_label_text_outline_width: float
    major_label_text_alpha: Alpha
    major_label_text_font: str
    major_label_text_font_size: FontSize
    major_label_text_font_style: FontStyle
    major_label_text_align: TextAlign
    major_label_text_baseline: TextBaseline
    major_label_text_line_height: float
    major_tick_line_color: Color | None
    major_tick_line_alpha: Alpha
    major_tick_line_width: float
    major_tick_line_join: LineJoin
    major_tick_line_cap: LineCap
    major_tick_line_dash: DashPattern
    major_tick_line_dash_offset: int
    minor_tick_line_color: Color | None
    minor_tick_line_alpha: Alpha
    minor_tick_line_width: float
    minor_tick_line_join: LineJoin
    minor_tick_line_cap: LineCap
    minor_tick_line_dash: DashPattern
    minor_tick_line_dash_offset: int
    bar_line_color: Color | None
    bar_line_alpha: Alpha
    bar_line_width: float
    bar_line_join: LineJoin
    bar_line_cap: LineCap
    bar_line_dash: DashPattern
    bar_line_dash_offset: int
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    location: HVAlign | tuple[float, float]
    orientation: Orientation | Auto
    height: Literal["max"] | int
    width: Literal["max"] | int
    margin: int
    padding: int
    title: TextLike | None
    title_standoff: int
    ticker: Ticker | Auto
    formatter: TickFormatter | Auto
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    label_standoff: int
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int

class BaseBar(Annotation, ScalarTitleTextProps, ScalarMajorLabelTextProps, ScalarMajorTickLineProps,
        ScalarMinorTickLineProps, ScalarBarLineProps, ScalarBorderLineProps, ScalarBackgroundFillProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_BaseBarInit]) -> None: ...

    location: HVAlign | tuple[float, float] = ...
    orientation: Orientation | Auto = ...
    height: Literal["max"] | int = ...
    width: Literal["max"] | int = ...
    margin: int = ...
    padding: int = ...
    title: TextLike | None = ...
    title_standoff: int = ...
    ticker: Ticker | Auto = ...
    formatter: TickFormatter | Auto = ...
    major_label_overrides: dict[float | str, TextLike] = ...
    major_label_policy: LabelingPolicy = ...
    label_standoff: int = ...
    major_tick_in: int = ...
    major_tick_out: int = ...
    minor_tick_in: int = ...
    minor_tick_out: int = ...

# class _SizeBarInit(_BaseBarInit, _GlyphLinePropsInit, _GlyphFillPropsInit, _GlyphHatchPropsInit, total=False):
#     renderer: GlyphRenderer[RadialGlyph] | Auto
#     bounds: tuple[float, float] | Auto

class _SizeBarInit(TypedDict, total=False):
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
    title_text_color: Color | None
    title_text_outline_color: Color | None
    title_text_outline_width: float
    title_text_alpha: Alpha
    title_text_font: str
    title_text_font_size: FontSize
    title_text_font_style: FontStyle
    title_text_align: TextAlign
    title_text_baseline: TextBaseline
    title_text_line_height: float
    major_label_text_color: Color | None
    major_label_text_outline_color: Color | None
    major_label_text_outline_width: float
    major_label_text_alpha: Alpha
    major_label_text_font: str
    major_label_text_font_size: FontSize
    major_label_text_font_style: FontStyle
    major_label_text_align: TextAlign
    major_label_text_baseline: TextBaseline
    major_label_text_line_height: float
    major_tick_line_color: Color | None
    major_tick_line_alpha: Alpha
    major_tick_line_width: float
    major_tick_line_join: LineJoin
    major_tick_line_cap: LineCap
    major_tick_line_dash: DashPattern
    major_tick_line_dash_offset: int
    minor_tick_line_color: Color | None
    minor_tick_line_alpha: Alpha
    minor_tick_line_width: float
    minor_tick_line_join: LineJoin
    minor_tick_line_cap: LineCap
    minor_tick_line_dash: DashPattern
    minor_tick_line_dash_offset: int
    bar_line_color: Color | None
    bar_line_alpha: Alpha
    bar_line_width: float
    bar_line_join: LineJoin
    bar_line_cap: LineCap
    bar_line_dash: DashPattern
    bar_line_dash_offset: int
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    location: HVAlign | tuple[float, float]
    orientation: Orientation | Auto
    height: Literal["max"] | int
    width: Literal["max"] | int
    margin: int
    padding: int
    title: TextLike | None
    title_standoff: int
    ticker: Ticker | Auto
    formatter: TickFormatter | Auto
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    label_standoff: int
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    glyph_line_color: ColorSpec
    glyph_line_alpha: AlphaSpec
    glyph_line_width: FloatSpec
    glyph_line_join: LineJoinSpec
    glyph_line_cap: LineCapSpec
    glyph_line_dash: DashPatternSpec
    glyph_line_dash_offset: IntSpec
    glyph_fill_color: ColorSpec
    glyph_fill_alpha: AlphaSpec
    glyph_hatch_color: ColorSpec
    glyph_hatch_alpha: AlphaSpec
    glyph_hatch_scale: FloatSpec
    glyph_hatch_pattern: HatchPatternSpec
    glyph_hatch_weight: FloatSpec
    glyph_hatch_extra: dict[str, Texture]
    renderer: GlyphRenderer[RadialGlyph] | Auto
    bounds: tuple[float, float] | Auto

class SizeBar(BaseBar, GlyphLineProps, GlyphFillProps, GlyphHatchProps):
    def __init__(self, **kwargs: Unpack[_SizeBarInit]) -> None: ...

    renderer: GlyphRenderer[RadialGlyph] | Auto = ...
    bounds: tuple[float, float] | Auto = ...
