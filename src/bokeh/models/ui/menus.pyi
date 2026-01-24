#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
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
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MenuItemInit]) -> None: ...

    checked: bool | None = ...
    icon: IconLike | None = ...
    label: str = ...
    shortcut: str | None = ...
    menu: Menu | None = ...
    tooltip: str | None = ...
    disabled: bool = ...
    action: Callback | None = ...

class _ActionItemInit(_MenuItemInit, total=False):
    ...

class ActionItem(MenuItem):
    def __init__(self, **kwargs: Unpack[_ActionItemInit]) -> None: ...

class _CheckableItemInit(_ActionItemInit, total=False):
    ...

class CheckableItem(ActionItem):
    def __init__(self, **kwargs: Unpack[_CheckableItemInit]) -> None: ...

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
