#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from datetime import datetime as DateTime, timedelta as TimeDelta
from pathlib import Path
from typing import (
    TYPE_CHECKING,
    Sequence,
    TypeVar,
)

# External imports
import numpy as np
import numpy.typing as npt

import re # isort:skip

if TYPE_CHECKING:
    import PIL.Image

# Bokeh imports
from .. import enums
from ..enums import AutoType as Auto
from .bases import Property

type DashPatternType = enums.DashPatternType | str | Sequence[int]
type DashPattern = Property[DashPatternType]

CSS_LENGTH_RE: re.Pattern

type ImageType = str | Path | PIL.Image.Image | npt.NDArray[np.uint8]
type Image = Property[ImageType]

type HatchPatternTypeType = enums.HatchPatternType | enums.HatchPatternAbbreviationType
type HatchPatternType = Property[HatchPatternTypeType]

T = TypeVar("T")

type Bounds[T] = tuple[T, T] | tuple[T | None, T] | tuple[T, T | None]

type MinMaxBoundsType = Auto | Bounds[float] | Bounds[DateTime] | Bounds[TimeDelta]
type MinMaxBounds = Property[MinMaxBoundsType]

type CSSLengthType = str
type CSSLength = Property[CSSLengthType]

type FontSizeType = str
type FontSize = Property[FontSizeType]

type MarkerTypeType = enums.MarkerTypeType
type MarkerType = Property[MarkerTypeType]
