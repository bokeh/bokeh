#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...core.enums import OrientationType as Orientation
from .widget import Widget, _WidgetInit

class _IndicatorInit(_WidgetInit, total=False):
    ...

class Indicator(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_IndicatorInit]) -> None: ...

class _ProgressInit(_IndicatorInit, total=False):
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
    def __init__(self, **kwargs: Unpack[_ProgressInit]) -> None: ...

    mode: Literal["determinate", "indeterminate"] = ...
    value: int = ...
    min: int = ...
    max: int = ...
    reversed: bool = ...
    orientation: Orientation = ...
    label: str | None = ...
    label_location: Literal["none", "inline"] = ...
    description: str | None = ...
