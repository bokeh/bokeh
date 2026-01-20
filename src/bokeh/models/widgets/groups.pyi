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
from .buttons import ButtonLike, ButtonLikeInit
from .widget import Widget, WidgetInit

class AbstractGroupInit(WidgetInit, total=False):
    labels: list[str]

class AbstractGroup(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[AbstractGroupInit]) -> None: ...

    labels: list[str] = ...

class ToggleButtonGroupInit(AbstractGroupInit, ButtonLikeInit, total=False):
    orientation: Literal["horizontal", "vertical"]

class ToggleButtonGroup(AbstractGroup, ButtonLike):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ToggleButtonGroupInit]) -> None: ...

    orientation: Literal["horizontal", "vertical"] = ...

class ToggleInputGroupInit(AbstractGroupInit, total=False):
    inline: bool

class ToggleInputGroup(AbstractGroup):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ToggleInputGroupInit]) -> None: ...

    inline: bool = ...

class CheckboxGroupInit(ToggleInputGroupInit, total=False):
    active: list[int]

class CheckboxGroup(ToggleInputGroup):
    def __init__(self, **kwargs: Unpack[CheckboxGroupInit]) -> None: ...

    active: list[int] = ...

class RadioGroupInit(ToggleInputGroupInit, total=False):
    active: int | None

class RadioGroup(ToggleInputGroup):
    def __init__(self, **kwargs: Unpack[RadioGroupInit]) -> None: ...

    active: int | None = ...

class CheckboxButtonGroupInit(ToggleButtonGroupInit, total=False):
    active: list[int]

class CheckboxButtonGroup(ToggleButtonGroup):
    def __init__(self, **kwargs: Unpack[CheckboxButtonGroupInit]) -> None: ...

    active: list[int] = ...

class RadioButtonGroupInit(ToggleButtonGroupInit, total=False):
    active: int | None

class RadioButtonGroup(ToggleButtonGroup):
    def __init__(self, **kwargs: Unpack[RadioButtonGroupInit]) -> None: ...

    active: int | None = ...
