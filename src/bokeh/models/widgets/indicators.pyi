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
from ...core.enums import OrientationType as Orientation
from ...core.has_props import abstract
from .widget import Widget

@abstract
@dataclass(init=False)
class Indicator(Widget):
    pass

@dataclass()
class Progress(Indicator):

    mode: Literal["determinate", "indeterminate"] = ...

    value: int = ...

    min: int = ...

    max: int = ...

    reversed: bool = ...

    orientation: Orientation = ...

    label: str | None = ...

    label_location: Literal["none", "inline"] = ...

    description: str | None = ...
