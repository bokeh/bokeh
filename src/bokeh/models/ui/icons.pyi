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
from ..._types import Color, FontSize
from ...core.enums import (
    AutoType as Auto,
    ToolIconType as ToolIcon,
)
from .ui_element import (
    Menu,
    Node,
    StyleSheet,
    Styles,
    UIElement,
    _UIElementInit,
)
from ...model.model import JSEventCallback

# class _IconInit(_UIElementInit, total=False):
#     size: int | FontSize

class _IconInit(TypedDict, total=False):
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
    size: int | FontSize

class Icon(UIElement):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_IconInit]) -> None: ...

    size: int | FontSize = ...

# class _BuiltinIconInit(_IconInit, total=False):
#     icon_name: ToolIcon | str
#     color: Color

class _BuiltinIconInit(TypedDict, total=False):
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
    size: int | FontSize
    icon_name: ToolIcon | str
    color: Color

class BuiltinIcon(Icon):
    def __init__(self, **kwargs: Unpack[_BuiltinIconInit]) -> None: ...

    icon_name: ToolIcon | str = ...
    color: Color = ...

# class _SVGIconInit(_IconInit, total=False):
#     svg: str

class _SVGIconInit(TypedDict, total=False):
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
    size: int | FontSize
    svg: str

class SVGIcon(Icon):
    def __init__(self, **kwargs: Unpack[_SVGIconInit]) -> None: ...

    svg: str = ...

# class _TablerIconInit(_IconInit, total=False):
#     icon_name: str

class _TablerIconInit(TypedDict, total=False):
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
    size: int | FontSize
    icon_name: str

class TablerIcon(Icon):
    def __init__(self, **kwargs: Unpack[_TablerIconInit]) -> None: ...

    icon_name: str = ...
