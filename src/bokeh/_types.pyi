#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
import datetime
from pathlib import Path
from typing import (
    TYPE_CHECKING,
    Never,
    NotRequired,
    Sequence,
    TypedDict,
)

# External imports
import numpy as np
import numpy.typing as npt

if TYPE_CHECKING:
    import PIL.Image

# Bokeh imports
from .core.enums import (
    AngleUnitsType as AngleUnits,
    CoordinateUnitsType as CoordinateUnits,
    DashPatternType,
    HatchPatternType as HatchPattern,
    LineCapType as LineCap,
    LineJoinType as LineJoin,
    MarkerTypeType as MarkerType,
    SpatialUnitsType as SpatialUnits,
    TextAlignType as TextAlign,
    TextBaselineType as TextBaseline,
)
from .core.property.vectorization import Expr, Field, Value
from .models.expressions import Expression
from .models.nodes import Node
from .models.ranges import Factor
from .models.text import BaseText
from .models.transforms import Transform

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

type DashPattern = DashPatternType | Regex | Sequence[int] # Regex(r"^(\d+(\s+\d+)*)?$")

type Image = str | Path | PIL.Image.Image | npt.NDArray[np.uint8]

type FieldName = str

class ValueDict[ValueType, UnitsType](TypedDict):
    value: ValueType
    transform: NotRequired[Transform]
    units: NotRequired[UnitsType]

class FieldDict[ValueType, UnitsType](TypedDict):
    field: FieldName
    transform: NotRequired[Transform]
    units: NotRequired[UnitsType]

class ExprDict[ValueType, UnitsType](TypedDict):
    expr: Expression
    transform: NotRequired[Transform]
    units: NotRequired[UnitsType]

type VectorInit[ValueType, UnitsType] = Value[ValueType] | Field | Expr
type VectorDict[ValueType, UnitsType] = ValueDict[ValueType, UnitsType] | FieldDict[ValueType, UnitsType] | ExprDict[ValueType, UnitsType]
type VectorLike[ValueType, UnitsType] = VectorInit[ValueType, UnitsType] | VectorDict[ValueType, UnitsType]

type Vectorized[ValueType, UnitsType] = FieldName | ValueType | VectorLike[ValueType, UnitsType]

type DataSpec[T] = Vectorized[T, Never]
type UnitsSpec[T, U] = Vectorized[T, U]

type IntSpec = DataSpec[int]
type FloatSpec = DataSpec[float]

type NumberSpec = DataSpec[float | Datetime | TimeDelta]
type SizeSpec = DataSpec[NonNegative[float] | Datetime | TimeDelta]
type AlphaSpec = FloatSpec

type ColorSpec = DataSpec[Color | None]

type StringSpec = DataSpec[str]
type NullStringSpec = DataSpec[str | None]

type FontSizeSpec = DataSpec[FontSize]
type FontStyleSpec = DataSpec[FontStyle]
type TextAlignSpec = DataSpec[TextAlign]
type TextBaselineSpec = DataSpec[TextBaseline]
type LineJoinSpec = DataSpec[LineJoin]
type LineCapSpec = DataSpec[LineCap]
type DashPatternSpec = DataSpec[DashPattern]
type HatchPatternSpec = DataSpec[HatchPattern | None]
type MarkerSpec = DataSpec[MarkerType | Regex] # Regex("^@.*$")

type CoordinateSpec = UnitsSpec[float | Datetime | TimeDelta, CoordinateUnits]
type AngleSpec = UnitsSpec[float, AngleUnits]

type DistanceSpec = UnitsSpec[NonNegative[float] | Datetime | TimeDelta, SpatialUnits]
type NullDistanceSpec = UnitsSpec[NonNegative[float] | Datetime | TimeDelta | None, SpatialUnits]

type Bytes = bytes
type JSON = str

type CoordinateLike = float | Datetime | Factor
type Coordinate = CoordinateLike | Node

type CSSLength = str
type CSSClass = str
type CSSVariable = str
