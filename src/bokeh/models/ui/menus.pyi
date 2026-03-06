#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.has_props import abstract
from ...core.property_aliases import IconLikeType as IconLike
from ...model import Model
from ..callbacks import Callback
from .ui_element import UIElement

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
