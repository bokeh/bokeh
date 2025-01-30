#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..._types import CSSClass, CSSVariable, Image
from ...core.enums import ToolIconType as ToolIcon
from ...core.has_props import abstract
from ...model import Model
from ..callbacks import Callback
from .ui_element import UIElement

type IconLike = Image | ToolIcon | CSSVariable | CSSClass

@abstract
@dataclass(init=False)
class MenuItem(Model):

    checked: bool | None = ...

    icon: IconLike | None = ...

    label: str = ...

    shortcut: str | None = ...

    menu: Menu | None = ...

    tooltip: str | None = ...

    disabled: bool = ...

    action: Callback | None = ...

@dataclass
class ActionItem(MenuItem):
    ...

@dataclass
class CheckableItem(ActionItem):
    ...

@dataclass
class DividerItem(Model):
    ...

@dataclass
class Menu(UIElement):

    items: list[MenuItem | DividerItem | None] = ...

    reversed: bool = ...
