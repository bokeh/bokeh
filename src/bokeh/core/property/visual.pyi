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

import re # isort:skip

if TYPE_CHECKING:
    import PIL.Image

# Bokeh imports
from .. import enums
from ..enums import AutoType as Auto
from .bases import Property

type DashPatternType = enums.DashPatternType | str | Sequence[int]
class DashPattern(Property[DashPatternType]): ...

CSS_LENGTH_RE: re.Pattern[str]

type ImageType = str | Path | PIL.Image.Image | npt.NDArray[np.uint8]
class Image(Property[ImageType]): ...

type HatchPatternTypeType = enums.HatchPatternType | enums.HatchPatternAbbreviationType
class HatchPatternType(Property[HatchPatternTypeType]): ...

type Bounds[T] = tuple[T, T] | tuple[T | None, T] | tuple[T, T | None]

type MinMaxBoundsType = Auto | Bounds[float] | Bounds[DateTime] | Bounds[TimeDelta]
class MinMaxBounds(Property[MinMaxBoundsType]): ...

type CSSLengthType = str
class CSSLength(Property[CSSLengthType]): ...

type FontSizeType = str
class FontSize(Property[FontSizeType]): ...

type MarkerTypeType = enums.MarkerTypeType
class MarkerType(Property[MarkerTypeType]): ...
