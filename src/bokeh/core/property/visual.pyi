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
    TypeAlias,
    TypeVar,
)

# External imports
import numpy as np
import numpy.typing as npt

if TYPE_CHECKING:
    import PIL.Image

# Bokeh imports
from .. import enums
from ..enums import AutoType as Auto
from .bases import Property

DashPatternType: TypeAlias = enums.DashPatternType | str | Sequence[int]
DashPattern: TypeAlias = Property[DashPatternType]

ImageType: TypeAlias = str | Path | PIL.Image.Image | npt.NDArray[np.uint8]
Image: TypeAlias = Property[ImageType]

HatchPatternTypeType: TypeAlias = enums.HatchPatternType | enums.HatchPatternAbbreviationType
HatchPatternType: TypeAlias = Property[HatchPatternTypeType]

T = TypeVar("T")

Bounds: TypeAlias = tuple[T, T] | tuple[T | None, T] | tuple[T, T | None]

MinMaxBoundsType: TypeAlias = Auto | Bounds[float] | Bounds[DateTime] | Bounds[TimeDelta]
MinMaxBounds: TypeAlias = Property[MinMaxBoundsType]

CSSLengthType: TypeAlias = str
CSSLength: TypeAlias = Property[CSSLengthType]

FontSizeType: TypeAlias = str
FontSize: TypeAlias = Property[FontSizeType]

MarkerTypeType: TypeAlias = enums.MarkerTypeType
MarkerType: TypeAlias = Property[MarkerTypeType]
