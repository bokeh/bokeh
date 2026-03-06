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
from ...core.property_aliases import IconLikeType as IconLike
from ...model.model import JSEventCallback, Model, _ModelInit
from ..callbacks import Callback
from .ui_element import (
    Node,
    StyleSheet,
    Styles,
    UIElement,
    _UIElementInit,
)
from ...core.enums import AutoType as Auto

# class _MenuItemInit(_ModelInit, total=False):
#     checked: bool | None
#     icon: IconLike | None
#     label: str
#     shortcut: str | None
#     menu: Menu | None
#     tooltip: str | None
#     disabled: bool
#     action: Callback | None

class _MenuItemInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    checked: bool | None
    icon: IconLike | None
    label: str
    shortcut: str | None
    menu: Menu | None
    tooltip: str | None
    disabled: bool
    action: Callback | None

class MenuItem(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MenuItemInit]) -> None: ...

    checked: bool | None = ...
    icon: IconLike | None = ...
    label: str = ...
    shortcut: str | None = ...
    menu: Menu | None = ...
    tooltip: str | None = ...
    disabled: bool = ...
    action: Callback | None = ...

# class _ActionItemInit(_MenuItemInit, total=False):
#     ...

class _ActionItemInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    checked: bool | None
    icon: IconLike | None
    label: str
    shortcut: str | None
    menu: Menu | None
    tooltip: str | None
    disabled: bool
    action: Callback | None

class ActionItem(MenuItem):
    def __init__(self, **kwargs: Unpack[_ActionItemInit]) -> None: ...

# class _CheckableItemInit(_ActionItemInit, total=False):
#     ...

class _CheckableItemInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    checked: bool | None
    icon: IconLike | None
    label: str
    shortcut: str | None
    menu: Menu | None
    tooltip: str | None
    disabled: bool
    action: Callback | None

class CheckableItem(ActionItem):
    def __init__(self, **kwargs: Unpack[_CheckableItemInit]) -> None: ...

# class _DividerItemInit(_ModelInit, total=False):
#     ...

class _DividerItemInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class DividerItem(Model):
    def __init__(self, **kwargs: Unpack[_DividerItemInit]) -> None: ...

# class _MenuInit(_UIElementInit, total=False):
#     items: list[MenuItem | DividerItem | None]
#     reversed: bool

class _MenuInit(TypedDict, total=False):
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
    items: list[MenuItem | DividerItem | None]
    reversed: bool

class Menu(UIElement):
    def __init__(self, **kwargs: Unpack[_MenuInit]) -> None: ...

    items: list[MenuItem | DividerItem | None] = ...
    reversed: bool = ...
