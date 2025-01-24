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

@abstract
@dataclass(init=False)
class MenuItem(Model):
    ...

@dataclass
class ActionItem(MenuItem):

    icon: Image | ToolIcon | CSSVariable | CSSClass | None = ...

    label: str = ...

    shortcut: str | None = ...

    menu: Menu | None = ...

    tooltip: str | None = ...

    disabled: bool = ...

    action: Callback | None = ...

@dataclass
class CheckableItem(ActionItem):

    checked: bool = ...

@dataclass
class DividerItem(MenuItem):
    ...

@dataclass
class Menu(UIElement):

    items: list[MenuItem] = ...

    reversed: bool = ...
