#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Any, TypedDict

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..core.enums import AutoType as Auto
from ..core.has_props import HasProps
from ..core.types import PathLike
from ..model.model import JSEventCallback, Model, _ModelInit
from ..models.ui import Dialog, UIElement

# class _CallbackInit(_ModelInit, total=False):
#     ...

class _CallbackInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class Callback(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CallbackInit]) -> None: ...

# class _OpenURLInit(_CallbackInit, total=False):
#     url: str
#     same_tab: bool

class _OpenURLInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    url: str
    same_tab: bool

class OpenURL(Callback):
    def __init__(self, **kwargs: Unpack[_OpenURLInit]) -> None: ...

    url: str = ...
    same_tab: bool = ...

# class _CustomCodeInit(_CallbackInit, total=False):
#     ...

class _CustomCodeInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class CustomCode(Callback):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CustomCodeInit]) -> None: ...

# class _CustomJSInit(_CustomCodeInit, total=False):
#     args: dict[str, Any]
#     code: str
#     module: Auto | bool

class _CustomJSInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    args: dict[str, Any]
    code: str
    module: Auto | bool

class CustomJS(CustomCode):
    def __init__(self, **kwargs: Unpack[_CustomJSInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...
    module: Auto | bool = ...

    @classmethod
    def from_file(cls, path: PathLike, **args: Any) -> CustomJS: ...

# class _SetValueInit(_CallbackInit, total=False):
#     obj: HasProps
#     attr: str
#     value: Any

class _SetValueInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    obj: HasProps
    attr: str
    value: Any

class SetValue(Callback):
    def __init__(self, **kwargs: Unpack[_SetValueInit]) -> None: ...

    obj: HasProps = ...
    attr: str = ...
    value: Any = ...

# class _ToggleVisibilityInit(_CallbackInit, total=False):
#     target: UIElement

class _ToggleVisibilityInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    target: UIElement

class ToggleVisibility(Callback):
    def __init__(self, **kwargs: Unpack[_ToggleVisibilityInit]) -> None: ...

    target: UIElement = ...

# class _OpenDialogInit(_CallbackInit, total=False):
#     dialog: Dialog

class _OpenDialogInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    dialog: Dialog

class OpenDialog(Callback):
    def __init__(self, **kwargs: Unpack[_OpenDialogInit]) -> None: ...

    dialog: Dialog = ...

# class _CloseDialogInit(_CallbackInit, total=False):
#     dialog: Dialog

class _CloseDialogInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    dialog: Dialog

class CloseDialog(Callback):
    def __init__(self, **kwargs: Unpack[_CloseDialogInit]) -> None: ...

    dialog: Dialog = ...
