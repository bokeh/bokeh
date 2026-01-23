#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Literal, Unpack

# Bokeh imports
from .buttons import ButtonLike, _ButtonLikeInit
from .widget import Widget, _WidgetInit

class _AbstractGroupInit(_WidgetInit, total=False):
    labels: list[str]

class AbstractGroup(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_AbstractGroupInit]) -> None: ...

    labels: list[str] = ...

class _ToggleButtonGroupInit(_AbstractGroupInit, _ButtonLikeInit, total=False):
    orientation: Literal["horizontal", "vertical"]

class ToggleButtonGroup(AbstractGroup, ButtonLike):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ToggleButtonGroupInit]) -> None: ...

    orientation: Literal["horizontal", "vertical"] = ...

class _ToggleInputGroupInit(_AbstractGroupInit, total=False):
    inline: bool

class ToggleInputGroup(AbstractGroup):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ToggleInputGroupInit]) -> None: ...

    inline: bool = ...

class _CheckboxGroupInit(_ToggleInputGroupInit, total=False):
    active: list[int]

class CheckboxGroup(ToggleInputGroup):
    def __init__(self, **kwargs: Unpack[_CheckboxGroupInit]) -> None: ...

    active: list[int] = ...

class _RadioGroupInit(_ToggleInputGroupInit, total=False):
    active: int | None

class RadioGroup(ToggleInputGroup):
    def __init__(self, **kwargs: Unpack[_RadioGroupInit]) -> None: ...

    active: int | None = ...

class _CheckboxButtonGroupInit(_ToggleButtonGroupInit, total=False):
    active: list[int]

class CheckboxButtonGroup(ToggleButtonGroup):
    def __init__(self, **kwargs: Unpack[_CheckboxButtonGroupInit]) -> None: ...

    active: list[int] = ...

class _RadioButtonGroupInit(_ToggleButtonGroupInit, total=False):
    active: int | None

class RadioButtonGroup(ToggleButtonGroup):
    def __init__(self, **kwargs: Unpack[_RadioButtonGroupInit]) -> None: ...

    active: int | None = ...
