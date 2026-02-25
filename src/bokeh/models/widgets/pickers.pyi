#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Literal, TypedDict

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..._types import (
    Date,
    Datetime,
    Positive,
    Time,
)
from ...core.enums import CalendarPositionType as CalendarPosition
from ...core.has_props import HasProps
from .inputs import InputWidget

from ..._types import NonNegative
from ...core.enums import AlignType as Align
from ...core.enums import AutoType as Auto
from ...core.enums import DimensionsType as Dimensions
from ...core.enums import FlowModeType as FlowMode
from ...core.enums import SizingModeType as SizingMode
from ...core.enums import SizingPolicyType as SizingPolicy
from ...model.model import JSEventCallback
from ..css import StyleSheet
from ..css import Styles
from ..dom import DOMNode
from ..dom import HTML
from ..nodes import Node
from ..ui import Tooltip
from ..ui.menus import Menu
from ..ui.ui_element import UIElement
from typing import Any
from typing import Sequence

class _PickerBaseInit(TypedDict, total=False):
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
    title: str | HTML
    description: str | Tooltip | None
    position: CalendarPosition
    inline: bool

class PickerBase(InputWidget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_PickerBaseInit]) -> None: ...

    position: CalendarPosition = ...
    inline: bool = ...

class _TimeCommonInit(TypedDict, total=False):
    hour_increment: Positive[int]
    minute_increment: Positive[int]
    second_increment: Positive[int]
    seconds: bool
    clock: Literal["12h", "24h"]

class TimeCommon(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TimeCommonInit]) -> None: ...

    hour_increment: Positive[int] = ...
    minute_increment: Positive[int] = ...
    second_increment: Positive[int] = ...
    seconds: bool = ...
    clock: Literal["12h", "24h"] = ...

class _TimePickerInit(TypedDict, total=False):
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
    title: str | HTML
    description: str | Tooltip | None
    position: CalendarPosition
    inline: bool
    hour_increment: Positive[int]
    minute_increment: Positive[int]
    second_increment: Positive[int]
    seconds: bool
    clock: Literal["12h", "24h"]
    value: Time | None
    time_format: str
    min_time: Time | None
    max_time: Time | None

class TimePicker(PickerBase, TimeCommon):
    def __init__(self, **kwargs: Unpack[_TimePickerInit]) -> None: ...

    value: Time | None = ...
    time_format: str = ...
    min_time: Time | None = ...
    max_time: Time | None = ...

class _DateCommonInit(TypedDict, total=False):
    disabled_dates: list[Date | tuple[Date, Date]] | None
    enabled_dates: list[Date | tuple[Date, Date]] | None
    date_format: str

class DateCommon(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DateCommonInit]) -> None: ...

    disabled_dates: list[Date | tuple[Date, Date]] | None = ...
    enabled_dates: list[Date | tuple[Date, Date]] | None = ...
    date_format: str = ...

class _BaseDatePickerInit(TypedDict, total=False):
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
    title: str | HTML
    description: str | Tooltip | None
    position: CalendarPosition
    inline: bool
    disabled_dates: list[Date | tuple[Date, Date]] | None
    enabled_dates: list[Date | tuple[Date, Date]] | None
    date_format: str
    min_date: Date | None
    max_date: Date | None

class BaseDatePicker(PickerBase, DateCommon):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_BaseDatePickerInit]) -> None: ...

    min_date: Date | None = ...
    max_date: Date | None = ...

class _DatePickerInit(TypedDict, total=False):
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
    title: str | HTML
    description: str | Tooltip | None
    position: CalendarPosition
    inline: bool
    disabled_dates: list[Date | tuple[Date, Date]] | None
    enabled_dates: list[Date | tuple[Date, Date]] | None
    date_format: str
    min_date: Date | None
    max_date: Date | None
    value: Date | None

class DatePicker(BaseDatePicker):
    def __init__(self, **kwargs: Unpack[_DatePickerInit]) -> None: ...

    value: Date | None = ...

class _DateRangePickerInit(TypedDict, total=False):
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
    title: str | HTML
    description: str | Tooltip | None
    position: CalendarPosition
    inline: bool
    disabled_dates: list[Date | tuple[Date, Date]] | None
    enabled_dates: list[Date | tuple[Date, Date]] | None
    date_format: str
    min_date: Date | None
    max_date: Date | None
    value: tuple[Date, Date] | None

class DateRangePicker(BaseDatePicker):
    def __init__(self, **kwargs: Unpack[_DateRangePickerInit]) -> None: ...

    value: tuple[Date, Date] | None = ...

class _MultipleDatePickerInit(TypedDict, total=False):
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
    title: str | HTML
    description: str | Tooltip | None
    position: CalendarPosition
    inline: bool
    disabled_dates: list[Date | tuple[Date, Date]] | None
    enabled_dates: list[Date | tuple[Date, Date]] | None
    date_format: str
    min_date: Date | None
    max_date: Date | None
    value: list[Date]
    separator: str

class MultipleDatePicker(BaseDatePicker):
    def __init__(self, **kwargs: Unpack[_MultipleDatePickerInit]) -> None: ...

    value: list[Date] = ...
    separator: str = ...

class _BaseDatetimePickerInit(TypedDict, total=False):
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
    title: str | HTML
    description: str | Tooltip | None
    position: CalendarPosition
    inline: bool
    disabled_dates: list[Date | tuple[Date, Date]] | None
    enabled_dates: list[Date | tuple[Date, Date]] | None
    date_format: str
    hour_increment: Positive[int]
    minute_increment: Positive[int]
    second_increment: Positive[int]
    seconds: bool
    clock: Literal["12h", "24h"]
    min_date: Datetime | Date | None
    max_date: Datetime | Date | None

class BaseDatetimePicker(PickerBase, DateCommon, TimeCommon):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_BaseDatetimePickerInit]) -> None: ...

    min_date: Datetime | Date | None = ...
    max_date: Datetime | Date | None = ...

class _DatetimePickerInit(TypedDict, total=False):
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
    title: str | HTML
    description: str | Tooltip | None
    position: CalendarPosition
    inline: bool
    disabled_dates: list[Date | tuple[Date, Date]] | None
    enabled_dates: list[Date | tuple[Date, Date]] | None
    date_format: str
    hour_increment: Positive[int]
    minute_increment: Positive[int]
    second_increment: Positive[int]
    seconds: bool
    clock: Literal["12h", "24h"]
    min_date: Datetime | Date | None
    max_date: Datetime | Date | None
    value: Datetime | None

class DatetimePicker(BaseDatetimePicker):
    def __init__(self, **kwargs: Unpack[_DatetimePickerInit]) -> None: ...

    value: Datetime | None = ...

class _DatetimeRangePickerInit(TypedDict, total=False):
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
    title: str | HTML
    description: str | Tooltip | None
    position: CalendarPosition
    inline: bool
    disabled_dates: list[Date | tuple[Date, Date]] | None
    enabled_dates: list[Date | tuple[Date, Date]] | None
    date_format: str
    hour_increment: Positive[int]
    minute_increment: Positive[int]
    second_increment: Positive[int]
    seconds: bool
    clock: Literal["12h", "24h"]
    min_date: Datetime | Date | None
    max_date: Datetime | Date | None
    value: tuple[Datetime, Datetime] | None

class DatetimeRangePicker(BaseDatetimePicker):
    def __init__(self, **kwargs: Unpack[_DatetimeRangePickerInit]) -> None: ...

    value: tuple[Datetime, Datetime] | None = ...

class _MultipleDatetimePickerInit(TypedDict, total=False):
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
    title: str | HTML
    description: str | Tooltip | None
    position: CalendarPosition
    inline: bool
    disabled_dates: list[Date | tuple[Date, Date]] | None
    enabled_dates: list[Date | tuple[Date, Date]] | None
    date_format: str
    hour_increment: Positive[int]
    minute_increment: Positive[int]
    second_increment: Positive[int]
    seconds: bool
    clock: Literal["12h", "24h"]
    min_date: Datetime | Date | None
    max_date: Datetime | Date | None
    value: list[Datetime]
    separator: str

class MultipleDatetimePicker(BaseDatetimePicker):
    def __init__(self, **kwargs: Unpack[_MultipleDatetimePickerInit]) -> None: ...

    value: list[Datetime] = ...
    separator: str = ...
