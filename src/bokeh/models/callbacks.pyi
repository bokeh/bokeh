#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Unpack

# Bokeh imports
from ..core.enums import AutoType as Auto
from ..core.has_props import HasProps
from ..core.types import PathLike
from ..model.model import Model, _ModelInit
from ..models.ui import Dialog, UIElement

class _CallbackInit(_ModelInit, total=False):
    ...

class Callback(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CallbackInit]) -> None: ...

class _OpenURLInit(_CallbackInit, total=False):
    url: str
    same_tab: bool

class OpenURL(Callback):
    def __init__(self, **kwargs: Unpack[_OpenURLInit]) -> None: ...

    url: str = ...
    same_tab: bool = ...

class _CustomCodeInit(_CallbackInit, total=False):
    ...

class CustomCode(Callback):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CustomCodeInit]) -> None: ...

class _CustomJSInit(_CustomCodeInit, total=False):
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

class _SetValueInit(_CallbackInit, total=False):
    obj: HasProps
    attr: str
    value: Any

class SetValue(Callback):
    def __init__(self, **kwargs: Unpack[_SetValueInit]) -> None: ...

    obj: HasProps = ...
    attr: str = ...
    value: Any = ...

class _ToggleVisibilityInit(_CallbackInit, total=False):
    target: UIElement

class ToggleVisibility(Callback):
    def __init__(self, **kwargs: Unpack[_ToggleVisibilityInit]) -> None: ...

    target: UIElement = ...

class _OpenDialogInit(_CallbackInit, total=False):
    dialog: Dialog

class OpenDialog(Callback):
    def __init__(self, **kwargs: Unpack[_OpenDialogInit]) -> None: ...

    dialog: Dialog = ...

class _CloseDialogInit(_CallbackInit, total=False):
    dialog: Dialog

class CloseDialog(Callback):
    def __init__(self, **kwargs: Unpack[_CloseDialogInit]) -> None: ...

    dialog: Dialog = ...
