#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Literal, Sequence, TypedDict, TYPE_CHECKING

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
    _ScalarAxisLabelTextPropsInit as _AxisLabelTextInit,
    _ScalarAxisLinePropsInit as _AxisLineInit,
    _ScalarBackgroundFillPropsInit as _BackgroundFillInit,
    _ScalarBackgroundHatchPropsInit as _BackgroundHatchInit,
    _ScalarGroupTextPropsInit as _GroupTextInit,
    _ScalarMajorLabelTextPropsInit as _MajorLabelTextInit,
    _ScalarMajorTickLinePropsInit as _MajorTickLineInit,
    _ScalarMinorTickLinePropsInit as _MinorTickLineInit,
    _ScalarSeparatorLinePropsInit as _SeparatorLineInit,
    _ScalarSubgroupTextPropsInit as _SubgroupTextInit,
)
from .formatters import TickFormatter
from .labeling import LabelingPolicy
from .ranges import Factor
from .renderers.renderer import (
    GuideRenderer,
    RenderLevelType as RenderLevel,
    _GuideRendererInit,
)
from .tickers import Ticker
from ..model.model import JSEventCallback
from .coordinates import CoordinateMapping
from .dom import RendererGroup
from .ui.ui_element import (Menu, Node, StyleSheet, Styles)

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

# class _AxisInit(_GuideRendererInit, _AxisLabelTextInit, _MajorLabelTextInit, _AxisLineInit, _MajorTickLineInit,
#         _MinorTickLineInit, _BackgroundFillInit, _BackgroundHatchInit, total=False):
#     dimension: Auto | Literal[0, 1]
#     face: Auto | Literal["front", "back"]
#     bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime]
#     ticker: Ticker
#     formatter: TickFormatter
#     axis_label: TextLike | None
#     axis_label_standoff: int
#     axis_label_orientation: LabelOrientation | float
#     axis_label_align: Align
#     major_label_standoff: int
#     major_label_orientation: LabelOrientation | float
#     major_label_overrides: dict[float | str, TextLike]
#     major_label_policy: LabelingPolicy
#     major_tick_in: int
#     major_tick_out: int
#     minor_tick_in: int
#     minor_tick_out: int
#     fixed_location: None | float | Factor

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

# class _ContinuousAxisInit(_AxisInit, total=False):
#     ...

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

# class _LinearAxisInit(_ContinuousAxisInit, total=False):
#     ...
#     #ticker: BasicTicker
#     #formatter: BasicTickFormatter

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

# class _LogAxisInit(_ContinuousAxisInit, total=False):
#     ...
#     #ticker: LogTicker
#     #formatter: LogTickFormatter

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

# class _CategoricalAxisInit(_AxisInit, _SeparatorLineInit, _GroupTextInit, _SubgroupTextInit, total=False):
#     #ticker: CategoricalTicker
#     #formatter: CategoricalTickFormatter

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

class CategoricalAxis(Axis, SeparatorLine, GroupText, SubgroupText):
    def __init__(self, **kwargs: Unpack[_CategoricalAxisInit]) -> None: ...

    #ticker: CategoricalTicker = ...
    #formatter: CategoricalTickFormatter = ...

    group_label_orientation: LabelOrientation | float = ...
    subgroup_label_orientation: LabelOrientation | float = ...

# class _DatetimeAxisInit(_LinearAxisInit, total=False):
#     ...
#     #ticker: DatetimeTicker
#     #formatter: DatetimeTickFormatter

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

# class _MercatorAxisInit(_LinearAxisInit, total=False):
#     ...
#     #ticker: MercatorTicker
#     #formatter: MercatorTickFormatter

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

# class _TimedeltaAxisInit(_LinearAxisInit, total=False):
#     ...
#     #ticker: TimedeltaTicker
#     #formatter: TimedeltaTickFormatter

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
