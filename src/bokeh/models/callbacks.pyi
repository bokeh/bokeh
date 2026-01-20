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
from ..model.model import Model, ModelInit
from ..models.ui import Dialog, UIElement

class CallbackInit(ModelInit, total=False):
    ...

class Callback(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[CallbackInit]) -> None: ...

class OpenURLInit(CallbackInit, total=False):
    url: str
    same_tab: bool

class OpenURL(Callback):
    def __init__(self, **kwargs: Unpack[OpenURLInit]) -> None: ...

    url: str = ...
    same_tab: bool = ...

class CustomCodeInit(CallbackInit, total=False):
    ...

class CustomCode(Callback):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[CustomCodeInit]) -> None: ...

class CustomJSInit(CustomCodeInit, total=False):
    args: dict[str, Any]
    code: str
    module: Auto | bool

class CustomJS(CustomCode):
    def __init__(self, **kwargs: Unpack[CustomJSInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...
    module: Auto | bool = ...

    @classmethod
    def from_file(cls, path: PathLike, **args: Any) -> CustomJS: ...

class SetValueInit(CallbackInit, total=False):
    obj: HasProps
    attr: str
    value: Any

class SetValue(Callback):
    def __init__(self, **kwargs: Unpack[SetValueInit]) -> None: ...

    obj: HasProps = ...
    attr: str = ...
    value: Any = ...

class ToggleVisibilityInit(CallbackInit, total=False):
    target: UIElement

class ToggleVisibility(Callback):
    def __init__(self, **kwargs: Unpack[ToggleVisibilityInit]) -> None: ...

    target: UIElement = ...

class OpenDialogInit(CallbackInit, total=False):
    dialog: Dialog

class OpenDialog(Callback):
    def __init__(self, **kwargs: Unpack[OpenDialogInit]) -> None: ...

    dialog: Dialog = ...

class CloseDialogInit(CallbackInit, total=False):
    dialog: Dialog

class CloseDialog(Callback):
    def __init__(self, **kwargs: Unpack[CloseDialogInit]) -> None: ...

    dialog: Dialog = ...
