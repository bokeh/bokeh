#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
import datetime
from pathlib import Path
from typing import TYPE_CHECKING, Sequence

# External imports
import numpy as np
import numpy.typing as npt

if TYPE_CHECKING:
    import PIL.Image

# Bokeh imports
from .core.enums import DashPatternType
from .models.nodes import Node
from .models.ranges import Factor
from .models.text import BaseText

type NonNegative[T] = T
type Positive[T] = T
type Readonly[T] = T

type TextLike = str | BaseText

type Date = str | datetime.date
type Datetime = str | datetime.date | datetime.datetime
type Time = str | datetime.time
type TimeDelta = datetime.timedelta

type Color = str | tuple[int, int, int] | tuple[int, int, int, float]
type ColorHex = Color

type Alpha = float
type Size = float
type Angle = float
type Percent = float

type FontSize = str
type FontStyle = str

type Regex = str

type DashPattern = DashPatternType | str | Sequence[int]

type Image = str | Path | PIL.Image.Image | npt.NDArray[np.uint8]

type Bytes = bytes
type JSON = str

type CoordinateLike = float | Datetime | Factor
type Coordinate = CoordinateLike | Node
