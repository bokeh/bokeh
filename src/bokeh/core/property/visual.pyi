#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from datetime import datetime as DateTime, timedelta as TimeDelta
from pathlib import Path
from typing import TYPE_CHECKING, Sequence

# External imports
import numpy as np
import numpy.typing as npt

if TYPE_CHECKING:
    import PIL.Image

# Bokeh imports
from .. import enums
from ..enums import AutoType as Auto
from .bases import Property

type DashPatternType = enums.DashPatternType | str | Sequence[int]
DashPattern = Property[DashPatternType]

type ImageType = str | Path | PIL.Image.Image | npt.NDArray[np.uint8]
Image = Property[ImageType]

type HatchPatternTypeType = enums.HatchPatternType | enums.HatchPatternAbbreviationType
HatchPatternType = Property[HatchPatternTypeType]

type Bounds[T] = tuple[T, T] | tuple[T | None, T] | tuple[T, T | None]

type MinMaxBoundsType = Auto | Bounds[float] | Bounds[DateTime] | Bounds[TimeDelta]
MinMaxBounds = Property[MinMaxBoundsType]

type CSSLengthType = str
CSSLength = Property[CSSLengthType]

type FontSizeType = str
FontSize = Property[FontSizeType]

type MarkerTypeType = enums.MarkerTypeType
MarkerType = Property[MarkerTypeType]
