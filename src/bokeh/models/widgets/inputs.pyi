#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import (
    TYPE_CHECKING,
    Any,
    Literal,
    Sequence,
    TypeAlias,
    TypedDict,
)

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..._types import (
    Color,
    ColorHex,
    NonNegative,
    Positive,
)
from ...core.enums import (
    AutoType as Auto,
    DimensionsType as Dimensions,
)
from ...core.property_aliases import IconLikeType as IconLike
from ...events import ModelEvent
from ..dom import HTML
from ..formatters import TickFormatter
from ..ui import Tooltip
from .widget import Widget, _WidgetInit
from ...model.model import JSEventCallback
from ..layouts import (AlignType as Align, FlowModeType as FlowMode, SizingModeType as SizingMode, SizingPolicyType as SizingPolicy)
from ..ui.tooltips import UIElement
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)
from .buttons import DOMNode

class ClearInput(ModelEvent):
    def __init__(self, model: InputWidget) -> None: ...

# class _InputWidgetInit(_WidgetInit, total=False):
#     title: str | HTML
#     description: str | Tooltip | None

class _InputWidgetInit(TypedDict, total=False):
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

class InputWidget(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_InputWidgetInit]) -> None: ...

    title: str | HTML = ...
    description: str | Tooltip | None = ...

# class _FileInputInit(_InputWidgetInit, total=False):
#     accept: str | list[str]
#     multiple: bool
#     directory: bool

class _FileInputInit(TypedDict, total=False):
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
    accept: str | list[str]
    multiple: bool
    directory: bool

class FileInput(InputWidget):
    def __init__(self, **kwargs: Unpack[_FileInputInit]) -> None: ...

    @property
    def value(self) -> str | list[str]: ...
    @property
    def mime_type(self) -> str | list[str]: ...
    @property
    def filename(self) -> str | list[str]: ...

    accept: str | list[str] = ...
    multiple: bool = ...
    directory: bool = ...

    def clear(self) -> None: ...

# class _NumericInputInit(_InputWidgetInit, total=False):
#     value: None | float | int
#     low: None | float | int
#     high: None | float | int
#     placeholder: str
#     mode: Literal["int", "float"]
#     format: None | str | TickFormatter

class _NumericInputInit(TypedDict, total=False):
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
    value: None | float | int
    low: None | float | int
    high: None | float | int
    placeholder: str
    mode: Literal["int", "float"]
    format: None | str | TickFormatter

class NumericInput(InputWidget):
    def __init__(self, **kwargs: Unpack[_NumericInputInit]) -> None: ...

    value: None | float | int = ...
    low: None | float | int = ...
    high: None | float | int = ...
    placeholder: str = ...
    mode: Literal["int", "float"] = ...
    format: None | str | TickFormatter = ...

# class _SpinnerInit(_NumericInputInit, total=False):
#     step: float
#     page_step_multiplier: float
#     wheel_wait: int | float

class _SpinnerInit(TypedDict, total=False):
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
    value: None | float | int
    low: None | float | int
    high: None | float | int
    placeholder: str
    mode: Literal["int", "float"]
    format: None | str | TickFormatter
    step: float
    page_step_multiplier: float
    wheel_wait: int | float

class Spinner(NumericInput):
    def __init__(self, **kwargs: Unpack[_SpinnerInit]) -> None: ...

    @property
    def value_throttled(self) -> int | float | None: ...

    step: float = ...
    page_step_multiplier: float = ...
    wheel_wait: int | float = ...

# class _ToggleInputInit(_WidgetInit, total=False):
#     active: bool
#     label: str

class _ToggleInputInit(TypedDict, total=False):
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
    active: bool
    label: str

class ToggleInput(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ToggleInputInit]) -> None: ...

    active: bool = ...
    label: str = ...

# class _CheckboxInit(_ToggleInputInit, total=False):
#     ...

class _CheckboxInit(TypedDict, total=False):
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
    active: bool
    label: str

class Checkbox(ToggleInput):
    def __init__(self, **kwargs: Unpack[_CheckboxInit]) -> None: ...

# class _SwitchInit(_ToggleInputInit, total=False):
#     on_icon: IconLike | None
#     off_icon: IconLike | None

class _SwitchInit(TypedDict, total=False):
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
    active: bool
    label: str
    on_icon: IconLike | None
    off_icon: IconLike | None

class Switch(ToggleInput):
    def __init__(self, **kwargs: Unpack[_SwitchInit]) -> None: ...

    on_icon: IconLike | None = ...
    off_icon: IconLike | None = ...

# class _TextLikeInputInit(_InputWidgetInit, total=False):
#     value: str
#     value_input: str
#     placeholder: str
#     max_length: int | None

class _TextLikeInputInit(TypedDict, total=False):
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
    value: str
    value_input: str
    placeholder: str
    max_length: int | None

class TextLikeInput(InputWidget):
    def __init__(self, **kwargs: Unpack[_TextLikeInputInit]) -> None: ...

    value: str = ...
    value_input: str = ...
    placeholder: str = ...
    max_length: int | None = ...

# class _TextInputInit(_TextLikeInputInit, total=False):
#     prefix: str | None
#     suffix: str | None

class _TextInputInit(TypedDict, total=False):
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
    value: str
    value_input: str
    placeholder: str
    max_length: int | None
    prefix: str | None
    suffix: str | None

class TextInput(TextLikeInput):
    def __init__(self, **kwargs: Unpack[_TextInputInit]) -> None: ...

    prefix: str | None = ...
    suffix: str | None = ...

# class _TextAreaInputInit(_TextLikeInputInit, total=False):
#     cols: int
#     rows: int

class _TextAreaInputInit(TypedDict, total=False):
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
    value: str
    value_input: str
    placeholder: str
    max_length: int | None
    cols: int
    rows: int

class TextAreaInput(TextLikeInput):
    def __init__(self, **kwargs: Unpack[_TextAreaInputInit]) -> None: ...

    cols: int = ...
    rows: int = ...

# class _PasswordInputInit(_TextInputInit, total=False):
#     ...

class _PasswordInputInit(TypedDict, total=False):
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
    value: str
    value_input: str
    placeholder: str
    max_length: int | None
    prefix: str | None
    suffix: str | None

class PasswordInput(TextInput):
    def __init__(self, **kwargs: Unpack[_PasswordInputInit]) -> None: ...

# class _AutocompleteInputInit(_TextInputInit, total=False):
#     completions: list[str]
#     max_completions: Positive[int] | None
#     min_characters: NonNegative[int]
#     case_sensitive: bool
#     restrict: bool
#     search_strategy: Literal["starts_with", "includes"]

class _AutocompleteInputInit(TypedDict, total=False):
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
    value: str
    value_input: str
    placeholder: str
    max_length: int | None
    prefix: str | None
    suffix: str | None
    completions: list[str]
    max_completions: Positive[int] | None
    min_characters: NonNegative[int]
    case_sensitive: bool
    restrict: bool
    search_strategy: Literal["starts_with", "includes"]

class AutocompleteInput(TextInput):
    def __init__(self, **kwargs: Unpack[_AutocompleteInputInit]) -> None: ...

    completions: list[str] = ...
    max_completions: Positive[int] | None = ...
    min_characters: NonNegative[int] = ...
    case_sensitive: bool = ...
    restrict: bool = ...
    search_strategy: Literal["starts_with", "includes"] = ...

Options: TypeAlias = list[str | tuple[Any, str]]
OptionsGroups: TypeAlias = dict[str, Options]

# class _SelectInit(_InputWidgetInit, total=False):
#     options: Options | OptionsGroups | list[str | None]
#     value: Any

class _SelectInit(TypedDict, total=False):
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
    options: Options | OptionsGroups | list[str | None]
    value: Any

class Select(InputWidget):
    def __init__(self, **kwargs: Unpack[_SelectInit]) -> None: ...

    @property
    def options(self) -> Options | OptionsGroups: ...
    @options.setter
    def options(self, options: Options | OptionsGroups | list[str | None]) -> None: ...

    value: Any = ...

# class _MultiSelectInit(_InputWidgetInit, total=False):
#     options: list[str | tuple[str, str]]
#     value: list[str]
#     size: int

class _MultiSelectInit(TypedDict, total=False):
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
    options: list[str | tuple[str, str]]
    value: list[str]
    size: int

class MultiSelect(InputWidget):
    def __init__(self, **kwargs: Unpack[_MultiSelectInit]) -> None: ...

    options: list[str | tuple[str, str]] = ...
    value: list[str] = ...
    size: int = ...

# class _MultiChoiceInit(_InputWidgetInit, total=False):
#     options: list[str | tuple[str, str]]
#     value: list[str]
#     delete_button: bool
#     max_items: int | None
#     option_limit: int | None
#     search_option_limit: int | None
#     placeholder: str | None
#     solid: bool

class _MultiChoiceInit(TypedDict, total=False):
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
    options: list[str | tuple[str, str]]
    value: list[str]
    delete_button: bool
    max_items: int | None
    option_limit: int | None
    search_option_limit: int | None
    placeholder: str | None
    solid: bool

class MultiChoice(InputWidget):
    def __init__(self, **kwargs: Unpack[_MultiChoiceInit]) -> None: ...

    options: list[str | tuple[str, str]] = ...
    value: list[str] = ...
    delete_button: bool = ...
    max_items: int | None = ...
    option_limit: int | None = ...
    search_option_limit: int | None = ...
    placeholder: str | None = ...
    solid: bool = ...

# class _ColorPickerInit(_InputWidgetInit, total=False):
#     color: ColorHex

class _ColorPickerInit(TypedDict, total=False):
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
    color: ColorHex

class ColorPicker(InputWidget):
    def __init__(self, **kwargs: Unpack[_ColorPickerInit]) -> None: ...

    color: ColorHex = ...

# class _PaletteSelectInit(_InputWidgetInit, total=False):
#     value: str
#     items: Sequence[tuple[str, Sequence[Color]]]
#     swatch_width: NonNegative[int]
#     swatch_height: Auto | NonNegative[int]
#     ncols: Positive[int]

class _PaletteSelectInit(TypedDict, total=False):
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
    value: str
    items: Sequence[tuple[str, Sequence[Color]]]
    swatch_width: NonNegative[int]
    swatch_height: Auto | NonNegative[int]
    ncols: Positive[int]

class PaletteSelect(InputWidget):
    def __init__(self, **kwargs: Unpack[_PaletteSelectInit]) -> None: ...

    value: str = ...
    items: Sequence[tuple[str, Sequence[Color]]] = ...
    swatch_width: NonNegative[int] = ...
    swatch_height: Auto | NonNegative[int] = ...
    ncols: Positive[int] = ...

def ColorMap(*args: Any, **kwargs: Any) -> PaletteSelect: ...
