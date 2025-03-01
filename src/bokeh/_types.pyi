#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
import datetime
from typing import TypeAlias, TypeVar

# Bokeh imports
from .models.nodes import Node
from .models.ranges import Factor
from .models.text import BaseText

T = TypeVar("T")

NonNegative: TypeAlias = T
Positive: TypeAlias = T
Readonly: TypeAlias = T

TextLike: TypeAlias = str | BaseText

Date: TypeAlias = str | datetime.date
Datetime: TypeAlias = str | datetime.date | datetime.datetime
Time: TypeAlias = str | datetime.time
TimeDelta: TypeAlias = datetime.timedelta

Color: TypeAlias = str | tuple[int, int, int] | tuple[int, int, int, float]
ColorHex: TypeAlias = Color

Alpha: TypeAlias = float
Size: TypeAlias = float
Angle: TypeAlias = float
Percent: TypeAlias = float

FontSize: TypeAlias = str
FontStyle: TypeAlias = str

Regex: TypeAlias = str

Bytes: TypeAlias = bytes
JSON: TypeAlias = str

CoordinateLike: TypeAlias = float | Datetime | Factor
Coordinate: TypeAlias = CoordinateLike | Node
