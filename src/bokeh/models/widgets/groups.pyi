#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Literal

# Bokeh imports
from ...core.has_props import abstract
from .buttons import ButtonLike
from .widget import Widget

@abstract
@dataclass(init=False)
class AbstractGroup(Widget):

    labels: list[str] = ...

@abstract
@dataclass(init=False)
class ToggleButtonGroup(AbstractGroup, ButtonLike):

    orientation: Literal["horizontal", "vertical"] = ...

@abstract
@dataclass(init=False)
class ToggleInputGroup(AbstractGroup):

    inline: bool = ...

@dataclass
class CheckboxGroup(ToggleInputGroup):

    active: list[int] = ...

@dataclass
class RadioGroup(ToggleInputGroup):

    active: int | None = ...

@dataclass
class CheckboxButtonGroup(ToggleButtonGroup):

    active: list[int] = ...

@dataclass
class RadioButtonGroup(ToggleButtonGroup):

    active: int | None = ...
