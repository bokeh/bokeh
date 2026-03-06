#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Callable, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...core.enums import (
    AutoType as Auto,
    ButtonTypeType as ButtonType,
    DimensionsType as Dimensions,
)
from ...core.has_props import HasProps
from ...util.callback_manager import EventCallback
from ..callbacks import Callback
from ..dom import DOMNode
from ..ui.icons import Icon
from ..ui.tooltips import Tooltip, UIElement
from .widget import Widget, _WidgetInit
from ...model.model import JSEventCallback
from ..._types import NonNegative
from ..layouts import (AlignType as Align, FlowModeType as FlowMode, SizingModeType as SizingMode, SizingPolicyType as SizingPolicy)
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)

# class _ButtonLikeInit(TypedDict, total=False):
#     button_type: ButtonType

class _ButtonLikeInit(TypedDict, total=False):
    button_type: ButtonType

class ButtonLike(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ButtonLikeInit]) -> None: ...

    button_type: ButtonType = ...

# class _AbstractButtonInit(_WidgetInit, _ButtonLikeInit, total=False):
#     label: DOMNode | str
#     icon: Icon | None

class _AbstractButtonInit(TypedDict, total=False):
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
    button_type: ButtonType
    label: DOMNode | str
    icon: Icon | None

class AbstractButton(Widget, ButtonLike):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_AbstractButtonInit]) -> None: ...

    label: DOMNode | str = ...
    icon: Icon | None = ...

# class _ButtonInit(_AbstractButtonInit, total=False):
#     ...

class _ButtonInit(TypedDict, total=False):
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
    button_type: ButtonType
    label: DOMNode | str
    icon: Icon | None

class Button(AbstractButton):
    def __init__(self, **kwargs: Unpack[_ButtonInit]) -> None: ...

    def on_click(self, handler: EventCallback) -> None: ...
    def js_on_click(self, handler: Callback) -> None: ...

# class _ToggleInit(_AbstractButtonInit, total=False):
#     active: bool

class _ToggleInit(TypedDict, total=False):
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
    button_type: ButtonType
    label: DOMNode | str
    icon: Icon | None
    active: bool

class Toggle(AbstractButton):
    def __init__(self, **kwargs: Unpack[_ToggleInit]) -> None: ...

    active: bool = ...

    def on_click(self, handler: Callable[[bool], None]) -> None: ...
    def js_on_click(self, handler: Callback) -> None: ...

# class _DropdownInit(_AbstractButtonInit, total=False):
#     split: bool
#     menu: list[str | tuple[str, str | Callback] | None]

class _DropdownInit(TypedDict, total=False):
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
    button_type: ButtonType
    label: DOMNode | str
    icon: Icon | None
    split: bool
    menu: list[str | tuple[str, str | Callback] | None]

class Dropdown(AbstractButton):
    def __init__(self, **kwargs: Unpack[_DropdownInit]) -> None: ...

    split: bool = ...
    menu: list[str | tuple[str, str | Callback] | None] = ...

    def on_click(self, handler: EventCallback) -> None: ...
    def js_on_click(self, handler: Callback) -> None: ...

# class _HelpButtonInit(_AbstractButtonInit, total=False):
#     tooltip: Tooltip

class _HelpButtonInit(TypedDict, total=False):
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
    button_type: ButtonType
    label: DOMNode | str
    icon: Icon | None
    tooltip: Tooltip

class HelpButton(AbstractButton):
    def __init__(self, **kwargs: Unpack[_HelpButtonInit]) -> None: ...

    tooltip: Tooltip = ...
