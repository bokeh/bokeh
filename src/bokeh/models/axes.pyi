#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from .._types import Datetime, TextLike
from ..core.enums import (
    AlignType as Align,
    AutoType as Auto,
    LabelOrientationType as LabelOrientation,
)
from ..core.property_mixins import (
    ScalarAxisLabelTextProps as AxisLabelText,
    ScalarAxisLineProps as AxisLine,
    ScalarBackgroundFillProps as BackgroundFill,
    ScalarBackgroundHatchProps as BackgroundHatch,
    ScalarGroupTextProps as GroupText,
    ScalarMajorLabelTextProps as MajorLabelText,
    ScalarMajorTickLineProps as MajorTickLine,
    ScalarMinorTickLineProps as MinorTickLine,
    ScalarSeparatorLineProps as SeparatorLine,
    ScalarSubgroupTextProps as SubgroupText,
)
from .formatters import TickFormatter
from .labeling import LabelingPolicy
from .ranges import Factor
from .renderers.renderer import GuideRenderer
from .tickers import Ticker

#from .formatters import (
#    BasicTickFormatter,
#    CategoricalTickFormatter,
#    DatetimeTickFormatter,
#    LogTickFormatter,
#    MercatorTickFormatter,
#    TickFormatter,
#    TimedeltaTickFormatter,
#)
#from .tickers import (
#     BasicTicker,
#    CategoricalTicker,
#    DatetimeTicker,
#    LogTicker,
#    MercatorTicker,
#    Ticker,
#    TimedeltaTicker,
#)

from .._types import Alpha
from .._types import Color
from .._types import FontSize
from .._types import Size
from ..core.enums import FontStyleType as FontStyle
from ..core.enums import LineCapType as LineCap
from ..core.enums import LineJoinType as LineJoin
from ..core.enums import RenderLevelType as RenderLevel
from ..core.enums import TextAlignType as TextAlign
from ..core.enums import TextBaselineType as TextBaseline
from ..core.property.visual import DashPatternType as DashPattern
from ..model.model import JSEventCallback
from .coordinates import CoordinateMapping
from .css import StyleSheet
from .css import Styles
from .nodes import Node
from .renderers.renderer import RendererGroup
from .textures import Texture
from .ui.menus import Menu
from typing import Any
from typing import Sequence
from typing import TypedDict

class _AxisInit(TypedDict, total=False):
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
    axis_label_text_color: Color | None
    axis_label_text_outline_color: Color | None
    axis_label_text_outline_width: float
    axis_label_text_alpha: Alpha
    axis_label_text_font: str
    axis_label_text_font_size: FontSize
    axis_label_text_font_style: FontStyle
    axis_label_text_align: TextAlign
    axis_label_text_baseline: TextBaseline
    axis_label_text_line_height: float
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
    axis_line_color: Color | None
    axis_line_alpha: Alpha
    axis_line_width: float
    axis_line_join: LineJoin
    axis_line_cap: LineCap
    axis_line_dash: DashPattern
    axis_line_dash_offset: int
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
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    dimension: Auto | Literal[0, 1]
    face: Auto | Literal["front", "back"]
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime]
    ticker: Ticker
    formatter: TickFormatter
    axis_label: TextLike | None
    axis_label_standoff: int
    axis_label_orientation: LabelOrientation | float
    axis_label_align: Align
    major_label_standoff: int
    major_label_orientation: LabelOrientation | float
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    fixed_location: None | float | Factor

class Axis(GuideRenderer, AxisLabelText, MajorLabelText, AxisLine, MajorTickLine, MinorTickLine, BackgroundFill, BackgroundHatch):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_AxisInit]) -> None: ...

    dimension: Auto | Literal[0, 1] = ...
    face: Auto | Literal["front", "back"] = ...
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime] = ...
    ticker: Ticker = ...
    formatter: TickFormatter = ...
    axis_label: TextLike | None = ...
    axis_label_standoff: int = ...
    axis_label_orientation: LabelOrientation | float = ...
    axis_label_align: Align = ...
    major_label_standoff: int = ...
    major_label_orientation: LabelOrientation | float = ...
    major_label_overrides: dict[float | str, TextLike] = ...
    major_label_policy: LabelingPolicy = ...
    major_tick_in: int = ...
    major_tick_out: int = ...
    minor_tick_in: int = ...
    minor_tick_out: int = ...
    fixed_location: None | float | Factor = ...

class _ContinuousAxisInit(TypedDict, total=False):
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
    axis_label_text_color: Color | None
    axis_label_text_outline_color: Color | None
    axis_label_text_outline_width: float
    axis_label_text_alpha: Alpha
    axis_label_text_font: str
    axis_label_text_font_size: FontSize
    axis_label_text_font_style: FontStyle
    axis_label_text_align: TextAlign
    axis_label_text_baseline: TextBaseline
    axis_label_text_line_height: float
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
    axis_line_color: Color | None
    axis_line_alpha: Alpha
    axis_line_width: float
    axis_line_join: LineJoin
    axis_line_cap: LineCap
    axis_line_dash: DashPattern
    axis_line_dash_offset: int
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
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    dimension: Auto | Literal[0, 1]
    face: Auto | Literal["front", "back"]
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime]
    ticker: Ticker
    formatter: TickFormatter
    axis_label: TextLike | None
    axis_label_standoff: int
    axis_label_orientation: LabelOrientation | float
    axis_label_align: Align
    major_label_standoff: int
    major_label_orientation: LabelOrientation | float
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    fixed_location: None | float | Factor

class ContinuousAxis(Axis):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ContinuousAxisInit]) -> None: ...

class _LinearAxisInit(TypedDict, total=False):
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
    axis_label_text_color: Color | None
    axis_label_text_outline_color: Color | None
    axis_label_text_outline_width: float
    axis_label_text_alpha: Alpha
    axis_label_text_font: str
    axis_label_text_font_size: FontSize
    axis_label_text_font_style: FontStyle
    axis_label_text_align: TextAlign
    axis_label_text_baseline: TextBaseline
    axis_label_text_line_height: float
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
    axis_line_color: Color | None
    axis_line_alpha: Alpha
    axis_line_width: float
    axis_line_join: LineJoin
    axis_line_cap: LineCap
    axis_line_dash: DashPattern
    axis_line_dash_offset: int
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
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    dimension: Auto | Literal[0, 1]
    face: Auto | Literal["front", "back"]
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime]
    ticker: Ticker
    formatter: TickFormatter
    axis_label: TextLike | None
    axis_label_standoff: int
    axis_label_orientation: LabelOrientation | float
    axis_label_align: Align
    major_label_standoff: int
    major_label_orientation: LabelOrientation | float
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    fixed_location: None | float | Factor
    #ticker: BasicTicker
    #formatter: BasicTickFormatter

class LinearAxis(ContinuousAxis):
    def __init__(self, **kwargs: Unpack[_LinearAxisInit]) -> None: ...

    #ticker: BasicTicker = ...
    #formatter: BasicTickFormatter = ...

class _LogAxisInit(TypedDict, total=False):
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
    axis_label_text_color: Color | None
    axis_label_text_outline_color: Color | None
    axis_label_text_outline_width: float
    axis_label_text_alpha: Alpha
    axis_label_text_font: str
    axis_label_text_font_size: FontSize
    axis_label_text_font_style: FontStyle
    axis_label_text_align: TextAlign
    axis_label_text_baseline: TextBaseline
    axis_label_text_line_height: float
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
    axis_line_color: Color | None
    axis_line_alpha: Alpha
    axis_line_width: float
    axis_line_join: LineJoin
    axis_line_cap: LineCap
    axis_line_dash: DashPattern
    axis_line_dash_offset: int
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
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    dimension: Auto | Literal[0, 1]
    face: Auto | Literal["front", "back"]
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime]
    ticker: Ticker
    formatter: TickFormatter
    axis_label: TextLike | None
    axis_label_standoff: int
    axis_label_orientation: LabelOrientation | float
    axis_label_align: Align
    major_label_standoff: int
    major_label_orientation: LabelOrientation | float
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    fixed_location: None | float | Factor
    #ticker: LogTicker
    #formatter: LogTickFormatter

class LogAxis(ContinuousAxis):
    def __init__(self, **kwargs: Unpack[_LogAxisInit]) -> None: ...

    #ticker: LogTicker = ...
    #formatter: LogTickFormatter = ...

class _CategoricalAxisInit(TypedDict, total=False):
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
    axis_label_text_color: Color | None
    axis_label_text_outline_color: Color | None
    axis_label_text_outline_width: float
    axis_label_text_alpha: Alpha
    axis_label_text_font: str
    axis_label_text_font_size: FontSize
    axis_label_text_font_style: FontStyle
    axis_label_text_align: TextAlign
    axis_label_text_baseline: TextBaseline
    axis_label_text_line_height: float
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
    axis_line_color: Color | None
    axis_line_alpha: Alpha
    axis_line_width: float
    axis_line_join: LineJoin
    axis_line_cap: LineCap
    axis_line_dash: DashPattern
    axis_line_dash_offset: int
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
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    separator_line_color: Color | None
    separator_line_alpha: Alpha
    separator_line_width: float
    separator_line_join: LineJoin
    separator_line_cap: LineCap
    separator_line_dash: DashPattern
    separator_line_dash_offset: int
    group_text_color: Color | None
    group_text_outline_color: Color | None
    group_text_outline_width: float
    group_text_alpha: Alpha
    group_text_font: str
    group_text_font_size: FontSize
    group_text_font_style: FontStyle
    group_text_align: TextAlign
    group_text_baseline: TextBaseline
    group_text_line_height: float
    subgroup_text_color: Color | None
    subgroup_text_outline_color: Color | None
    subgroup_text_alpha: Alpha
    subgroup_text_font: str
    subgroup_text_font_size: FontSize
    subgroup_text_font_style: FontStyle
    subgroup_text_align: TextAlign
    subgroup_text_baseline: TextBaseline
    subgroup_text_line_height: float
    dimension: Auto | Literal[0, 1]
    face: Auto | Literal["front", "back"]
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime]
    ticker: Ticker
    formatter: TickFormatter
    axis_label: TextLike | None
    axis_label_standoff: int
    axis_label_orientation: LabelOrientation | float
    axis_label_align: Align
    major_label_standoff: int
    major_label_orientation: LabelOrientation | float
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    fixed_location: None | float | Factor
    group_label_orientation: LabelOrientation | float
    subgroup_label_orientation: LabelOrientation | float
    #ticker: CategoricalTicker
    #formatter: CategoricalTickFormatter

class CategoricalAxis(Axis, SeparatorLine, GroupText, SubgroupText):
    def __init__(self, **kwargs: Unpack[_CategoricalAxisInit]) -> None: ...

    #ticker: CategoricalTicker = ...
    #formatter: CategoricalTickFormatter = ...

    group_label_orientation: LabelOrientation | float = ...
    subgroup_label_orientation: LabelOrientation | float = ...

class _DatetimeAxisInit(TypedDict, total=False):
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
    axis_label_text_color: Color | None
    axis_label_text_outline_color: Color | None
    axis_label_text_outline_width: float
    axis_label_text_alpha: Alpha
    axis_label_text_font: str
    axis_label_text_font_size: FontSize
    axis_label_text_font_style: FontStyle
    axis_label_text_align: TextAlign
    axis_label_text_baseline: TextBaseline
    axis_label_text_line_height: float
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
    axis_line_color: Color | None
    axis_line_alpha: Alpha
    axis_line_width: float
    axis_line_join: LineJoin
    axis_line_cap: LineCap
    axis_line_dash: DashPattern
    axis_line_dash_offset: int
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
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    dimension: Auto | Literal[0, 1]
    face: Auto | Literal["front", "back"]
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime]
    ticker: Ticker
    formatter: TickFormatter
    axis_label: TextLike | None
    axis_label_standoff: int
    axis_label_orientation: LabelOrientation | float
    axis_label_align: Align
    major_label_standoff: int
    major_label_orientation: LabelOrientation | float
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    fixed_location: None | float | Factor
    #ticker: DatetimeTicker
    #formatter: DatetimeTickFormatter

class DatetimeAxis(LinearAxis):
    def __init__(self, **kwargs: Unpack[_DatetimeAxisInit]) -> None: ...

    #ticker: DatetimeTicker = ...
    #formatter: DatetimeTickFormatter = ...

class _MercatorAxisInit(TypedDict, total=False):
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
    axis_label_text_color: Color | None
    axis_label_text_outline_color: Color | None
    axis_label_text_outline_width: float
    axis_label_text_alpha: Alpha
    axis_label_text_font: str
    axis_label_text_font_size: FontSize
    axis_label_text_font_style: FontStyle
    axis_label_text_align: TextAlign
    axis_label_text_baseline: TextBaseline
    axis_label_text_line_height: float
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
    axis_line_color: Color | None
    axis_line_alpha: Alpha
    axis_line_width: float
    axis_line_join: LineJoin
    axis_line_cap: LineCap
    axis_line_dash: DashPattern
    axis_line_dash_offset: int
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
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    dimension: Auto | Literal[0, 1]
    face: Auto | Literal["front", "back"]
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime]
    ticker: Ticker
    formatter: TickFormatter
    axis_label: TextLike | None
    axis_label_standoff: int
    axis_label_orientation: LabelOrientation | float
    axis_label_align: Align
    major_label_standoff: int
    major_label_orientation: LabelOrientation | float
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    fixed_location: None | float | Factor
    #ticker: MercatorTicker
    #formatter: MercatorTickFormatter

class MercatorAxis(LinearAxis):
    def __init__(self, **kwargs: Unpack[_MercatorAxisInit]) -> None: ...

    #ticker: MercatorTicker = ...
    #formatter: MercatorTickFormatter = ...

class _TimedeltaAxisInit(TypedDict, total=False):
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
    axis_label_text_color: Color | None
    axis_label_text_outline_color: Color | None
    axis_label_text_outline_width: float
    axis_label_text_alpha: Alpha
    axis_label_text_font: str
    axis_label_text_font_size: FontSize
    axis_label_text_font_style: FontStyle
    axis_label_text_align: TextAlign
    axis_label_text_baseline: TextBaseline
    axis_label_text_line_height: float
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
    axis_line_color: Color | None
    axis_line_alpha: Alpha
    axis_line_width: float
    axis_line_join: LineJoin
    axis_line_cap: LineCap
    axis_line_dash: DashPattern
    axis_line_dash_offset: int
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
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    dimension: Auto | Literal[0, 1]
    face: Auto | Literal["front", "back"]
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime]
    ticker: Ticker
    formatter: TickFormatter
    axis_label: TextLike | None
    axis_label_standoff: int
    axis_label_orientation: LabelOrientation | float
    axis_label_align: Align
    major_label_standoff: int
    major_label_orientation: LabelOrientation | float
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    fixed_location: None | float | Factor
    #ticker: TimedeltaTicker
    #formatter: TimedeltaTickFormatter

class TimedeltaAxis(LinearAxis):
    def __init__(self, **kwargs: Unpack[_TimedeltaAxisInit]) -> None: ...

    #ticker: TimedeltaTicker = ...
    #formatter: TimedeltaTickFormatter = ...
