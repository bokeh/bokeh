#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Callable

# Bokeh imports
from ...core.enums import ButtonTypeType as ButtonType
from ...core.has_props import HasProps, abstract
from ...util.callback_manager import EventCallback
from ..callbacks import Callback
from ..dom import DOMNode
from ..ui.icons import Icon
from ..ui.tooltips import Tooltip
from .widget import Widget

@abstract
@dataclass(init=False)
class ButtonLike(HasProps):

    button_type: ButtonType = ...

@abstract
@dataclass(init=False)
class AbstractButton(Widget, ButtonLike):

    label: DOMNode | str = ...

    icon: Icon | None = ...

@dataclass
class Button(AbstractButton):

    def on_click(self, handler: EventCallback) -> None: ...

    def js_on_click(self, handler: Callback) -> None: ...

@dataclass
class Toggle(AbstractButton):

    active: bool = ...

    def on_click(self, handler: Callable[[bool], None]) -> None: ...

    def js_on_click(self, handler: Callback) -> None: ...

@dataclass
class Dropdown(AbstractButton):

    split: bool = ...

    menu: list[str | tuple[str, str | Callback] | None] = ...

    def on_click(self, handler: EventCallback) -> None: ...

    def js_on_click(self, handler: Callback) -> None: ...

@dataclass
class HelpButton(AbstractButton):

    tooltip: Tooltip = ...
