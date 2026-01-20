#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Unpack

# Bokeh imports
from ...core.property_aliases import IconLikeType as IconLike
from ...model.model import Model, ModelInit
from ..callbacks import Callback
from .ui_element import UIElement, UIElementInit

class MenuItemInit(ModelInit, total=False):
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
    def __init__(self, **kwargs: Unpack[MenuItemInit]) -> None: ...

    checked: bool | None = ...
    icon: IconLike | None = ...
    label: str = ...
    shortcut: str | None = ...
    menu: Menu | None = ...
    tooltip: str | None = ...
    disabled: bool = ...
    action: Callback | None = ...

class ActionItemInit(MenuItemInit, total=False):
    ...

class ActionItem(MenuItem):
    def __init__(self, **kwargs: Unpack[ActionItemInit]) -> None: ...

class CheckableItemInit(ActionItemInit, total=False):
    ...

class CheckableItem(ActionItem):
    def __init__(self, **kwargs: Unpack[CheckableItemInit]) -> None: ...

class DividerItemInit(ModelInit, total=False):
    ...

class DividerItem(Model):
    def __init__(self, **kwargs: Unpack[DividerItemInit]) -> None: ...

class MenuInit(UIElementInit, total=False):
    items: list[MenuItem | DividerItem | None]
    reversed: bool

class Menu(UIElement):
    def __init__(self, **kwargs: Unpack[MenuInit]) -> None: ...

    items: list[MenuItem | DividerItem | None] = ...
    reversed: bool = ...
