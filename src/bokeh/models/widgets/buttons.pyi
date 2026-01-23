#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Callable, TypedDict, Unpack

# Bokeh imports
from ...core.enums import ButtonTypeType as ButtonType
from ...core.has_props import HasProps
from ...util.callback_manager import EventCallback
from ..callbacks import Callback
from ..dom import DOMNode
from ..ui.icons import Icon
from ..ui.tooltips import Tooltip
from .widget import Widget, _WidgetInit

class _ButtonLikeInit(TypedDict, total=False):
    button_type: ButtonType

class ButtonLike(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ButtonLikeInit]) -> None: ...

    button_type: ButtonType = ...

class _AbstractButtonInit(_WidgetInit, _ButtonLikeInit, total=False):
    label: DOMNode | str
    icon: Icon | None

class AbstractButton(Widget, ButtonLike):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_AbstractButtonInit]) -> None: ...

    label: DOMNode | str = ...
    icon: Icon | None = ...

class _ButtonInit(_AbstractButtonInit, total=False):
    ...

class Button(AbstractButton):
    def __init__(self, **kwargs: Unpack[_ButtonInit]) -> None: ...

    def on_click(self, handler: EventCallback) -> None: ...
    def js_on_click(self, handler: Callback) -> None: ...

class _ToggleInit(_AbstractButtonInit, total=False):
    active: bool

class Toggle(AbstractButton):
    def __init__(self, **kwargs: Unpack[_ToggleInit]) -> None: ...

    active: bool = ...

    def on_click(self, handler: Callable[[bool], None]) -> None: ...
    def js_on_click(self, handler: Callback) -> None: ...

class _DropdownInit(_AbstractButtonInit, total=False):
    split: bool
    menu: list[str | tuple[str, str | Callback] | None]

class Dropdown(AbstractButton):
    def __init__(self, **kwargs: Unpack[_DropdownInit]) -> None: ...

    split: bool = ...
    menu: list[str | tuple[str, str | Callback] | None] = ...

    def on_click(self, handler: EventCallback) -> None: ...
    def js_on_click(self, handler: Callback) -> None: ...

class _HelpButtonInit(_AbstractButtonInit, total=False):
    tooltip: Tooltip

class HelpButton(AbstractButton):
    def __init__(self, **kwargs: Unpack[_HelpButtonInit]) -> None: ...

    tooltip: Tooltip = ...
