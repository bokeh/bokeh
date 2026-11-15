#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from typing import Unpack

from ...core.property_aliases import IconLikeType as IconLike
from ...model.model import Model, _ModelInit
from ..callbacks import Callback
from .ui_element import UIElement, _UIElementInit

class _MenuItemInit(_ModelInit, total=False):
    checked: bool | None
    icon: IconLike | None
    label: str
    shortcut: str | None
    menu: Menu | None
    tooltip: str | None
    disabled: bool
    action: Callback | None

class MenuItem(Model):
    def __init__(self, **kwargs: Unpack[_MenuItemInit]) -> None: ...

    checked: bool | None = ...
    icon: IconLike | None = ...
    label: str = ...
    shortcut: str | None = ...
    menu: Menu | None = ...
    tooltip: str | None = ...
    disabled: bool = ...
    action: Callback | None = ...

class _DividerItemInit(_ModelInit, total=False):
    ...

class DividerItem(Model):
    def __init__(self, **kwargs: Unpack[_DividerItemInit]) -> None: ...

class _MenuInit(_UIElementInit, total=False):
    items: list[MenuItem | DividerItem | None]
    reversed: bool

class Menu(UIElement):
    def __init__(self, **kwargs: Unpack[_MenuInit]) -> None: ...

    items: list[MenuItem | DividerItem | None] = ...
    reversed: bool = ...
