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
from ...core.enums import OrientationType as Orientation
from .widget import Widget, WidgetInit

class IndicatorInit(WidgetInit, total=False):
    ...

class Indicator(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[IndicatorInit]) -> None: ...

class ProgressInit(IndicatorInit, total=False):
    mode: Literal["determinate", "indeterminate"]
    value: int
    min: int
    max: int
    reversed: bool
    orientation: Orientation
    label: str | None
    label_location: Literal["none", "inline"]
    description: str | None

class Progress(Indicator):
    def __init__(self, **kwargs: Unpack[ProgressInit]) -> None: ...

    mode: Literal["determinate", "indeterminate"] = ...
    value: int = ...
    min: int = ...
    max: int = ...
    reversed: bool = ...
    orientation: Orientation = ...
    label: str | None = ...
    label_location: Literal["none", "inline"] = ...
    description: str | None = ...
