#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from datetime import date, datetime
from typing import Any, Literal, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..._types import (
    Color,
    Datetime,
    NonNegative,
)
from ..formatters import TickFormatter
from .widget import Widget, _WidgetInit
from ...model.model import JSEventCallback
from ...core.enums import (
    AutoType as Auto,
    DimensionsType as Dimensions,
)
from ..layouts import (AlignType as Align, FlowModeType as FlowMode, SizingModeType as SizingMode, SizingPolicyType as SizingPolicy)
from ..ui.tooltips import UIElement
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)
from .buttons import DOMNode

# class _AbstractSliderInit(_WidgetInit, total=False):
#     orientation: Literal["horizontal", "vertical"]
#     title: str | None
#     show_value: bool
#     direction: Literal["ltr", "rtl"]
#     tooltips: bool
#     bar_color: Color

class _AbstractSliderInit(TypedDict, total=False):
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
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color

class AbstractSlider(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_AbstractSliderInit]) -> None: ...

    orientation: Literal["horizontal", "vertical"] = ...
    title: str | None = ...
    show_value: bool = ...
    direction: Literal["ltr", "rtl"] = ...
    tooltips: bool = ...
    bar_color: Color = ...

# class _NumericalSliderInit(_AbstractSliderInit, total=False):
#     format: str | TickFormatter

class _NumericalSliderInit(TypedDict, total=False):
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
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter

class NumericalSlider(AbstractSlider):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_NumericalSliderInit]) -> None: ...

    format: str | TickFormatter = ...

# class _CategoricalSliderInit(_AbstractSliderInit, total=False):
#     categories: Sequence[str]
#     value: str

class _CategoricalSliderInit(TypedDict, total=False):
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
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    categories: Sequence[str]
    value: str

class CategoricalSlider(AbstractSlider):
    def __init__(self, **kwargs: Unpack[_CategoricalSliderInit]) -> None: ...

    categories: Sequence[str] = ...
    value: str = ...

    @property
    def value_throttled(self) -> str: ...

# class _SliderInit(_NumericalSliderInit, total=False):
#     start: float
#     end: float
#     value: float
#     step: float

class _SliderInit(TypedDict, total=False):
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
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter
    start: float
    end: float
    value: float
    step: float

class Slider(NumericalSlider):
    def __init__(self, **kwargs: Unpack[_SliderInit]) -> None: ...

    start: float = ...
    end: float = ...
    value: float = ...
    step: float = ...

    @property
    def value_throttled(self) -> float: ...

# class _RangeSliderInit(_NumericalSliderInit, total=False):
#     value: tuple[float, float]
#     start: float
#     end: float
#     step: float

class _RangeSliderInit(TypedDict, total=False):
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
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter
    value: tuple[float, float]
    start: float
    end: float
    step: float

class RangeSlider(NumericalSlider):
    def __init__(self, **kwargs: Unpack[_RangeSliderInit]) -> None: ...

    value: tuple[float, float] = ...
    start: float = ...
    end: float = ...
    step: float = ...

    @property
    def value_throttled(self) -> tuple[float, float]: ...

# class _DateSliderInit(_NumericalSliderInit, total=False):
#     value: Datetime
#     start: Datetime
#     end: Datetime
#     step: int

class _DateSliderInit(TypedDict, total=False):
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
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter
    value: Datetime
    start: Datetime
    end: Datetime
    step: int

class DateSlider(NumericalSlider):
    def __init__(self, **kwargs: Unpack[_DateSliderInit]) -> None: ...

    value: Datetime = ...
    start: Datetime = ...
    end: Datetime = ...
    step: int = ...

    @property
    def value_throttled(self) -> Datetime: ...
    @property
    def value_as_datetime(self) -> datetime | None: ...
    @property
    def value_as_date(self) -> date | None: ...

# class _DateRangeSliderInit(_NumericalSliderInit, total=False):
#     value: tuple[Datetime, Datetime]
#     start: Datetime
#     end: Datetime
#     step: int

class _DateRangeSliderInit(TypedDict, total=False):
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
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter
    value: tuple[Datetime, Datetime]
    start: Datetime
    end: Datetime
    step: int

class DateRangeSlider(NumericalSlider):
    def __init__(self, **kwargs: Unpack[_DateRangeSliderInit]) -> None: ...

    value: tuple[Datetime, Datetime] = ...
    start: Datetime = ...
    end: Datetime = ...
    step: int = ...

    @property
    def value_throttled(self) -> tuple[Datetime, Datetime]: ...
    @property
    def value_as_datetime(self) -> tuple[datetime, datetime] | None: ...
    @property
    def value_as_date(self) -> tuple[date, date] | None: ...

# class _DatetimeRangeSliderInit(_NumericalSliderInit, total=False):
#     value: tuple[Datetime, Datetime]
#     start: Datetime
#     end: Datetime
#     step: int

class _DatetimeRangeSliderInit(TypedDict, total=False):
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
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter
    value: tuple[Datetime, Datetime]
    start: Datetime
    end: Datetime
    step: int

class DatetimeRangeSlider(NumericalSlider):
    def __init__(self, **kwargs: Unpack[_DatetimeRangeSliderInit]) -> None: ...

    value: tuple[Datetime, Datetime] = ...
    start: Datetime = ...
    end: Datetime = ...
    step: int = ...

    @property
    def value_throttled(self) -> tuple[Datetime, Datetime]: ...
    @property
    def value_as_datetime(self) -> tuple[datetime, datetime] | None: ...
