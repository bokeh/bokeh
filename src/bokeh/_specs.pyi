#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    Never,
    NotRequired,
    Sequence,
    TypedDict,
)

# External imports
import numpy as np
import numpy.typing as npt

# Bokeh imports
from ._types import (
    Color,
    DashPattern,
    Datetime,
    FontSize,
    FontStyle,
    NonNegative,
    TimeDelta,
)
from .core.enums import (
    AngleUnitsType as AngleUnits,
    CoordinateUnitsType as CoordinateUnits,
    HatchPatternType as HatchPattern,
    LineCapType as LineCap,
    LineJoinType as LineJoin,
    MarkerTypeType as MarkerType,
    OutlineShapeNameType as OutlineShapeName,
    SpatialUnitsType as SpatialUnits,
    TextAlignType as TextAlign,
    TextBaselineType as TextBaseline,
)
from .core.property.vectorization import Expr, Field, Value
from .core.property_aliases import TextAnchorType as TextAnchor
from .models.expressions import Expression
from .models.transforms import Transform

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

type IntArray = npt.NDArray[np.integer]
type FloatArray = npt.NDArray[np.floating]
type NumberArray = FloatArray | npt.NDArray[np.datetime64] | npt.NDArray[np.timedelta64]
type Number1dArray = NumberArray # TODO shape
type Number2dArray = NumberArray # TODO shape
type Number3dArray = NumberArray # TODO shape
type StringArray = npt.NDArray[np.str_]

type DataSpec[T] = Vectorized[T, Never]
type UnitsSpec[T, U] = Vectorized[T, U]

type IntVal = int
type IntSpec = DataSpec[IntVal]
type IntArg = FieldName | IntVal | IntSpec | Sequence[IntVal] | IntArray

type FloatVal = float
type FloatSpec = DataSpec[FloatVal]
type FloatArg = FieldName | FloatVal | FloatSpec | Sequence[FloatVal] | FloatArray

type NumberVal = float | Datetime | TimeDelta
type NumberSpec = DataSpec[NumberVal]
type NumberArg = FieldName | NumberVal | NumberSpec | Sequence[NumberVal] | NumberArray

type Number1dVal = Sequence[float | Datetime | TimeDelta]
type Number1dSpec = DataSpec[Number1dVal]
type Number1dArg = FieldName | Number1dVal | Number1dSpec | Sequence[Number1dVal] | Number1dArray

type Number2dVal = Sequence[Sequence[float | Datetime | TimeDelta]]
type Number2dSpec = DataSpec[Number2dVal]
type Number2dArg = FieldName | Number2dVal | Number2dSpec | Sequence[Number2dVal] | Number2dArray

type Number3dVal = Sequence[Sequence[Sequence[float | Datetime | TimeDelta]]]
type Number3dSpec = DataSpec[Number3dVal]
type Number3dArg = FieldName | Number3dVal | Number3dSpec | Sequence[Number3dVal] | Number3dArray

type SizeVal = NonNegative[float] | Datetime | TimeDelta
type SizeSpec = DataSpec[SizeVal]
type SizeArg = FieldName | SizeVal | Sequence[SizeVal] | SizeSpec | NumberArray

type AlphaVal = FloatVal
type AlphaSpec = FloatSpec
type AlphaArg = FloatArg

type ColorVal = Color | None
type ColorSpec = DataSpec[Color | None]
type ColorArg = FieldName | ColorVal | Sequence[ColorVal] | ColorSpec | npt.NDArray[np.uint8] # TODO

type StringVal = str
type StringSpec = DataSpec[StringVal]
type StringArg = FieldName | StringVal | Sequence[StringVal] | StringSpec | StringArray

type NullStringVal = StringVal | None
type NullStringSpec = DataSpec[NullStringVal]
type NullStringArg = FieldName | NullStringVal | Sequence[NullStringVal] | NullStringSpec | StringArray

type FontSizeVal = FontSize
type FontSizeSpec = DataSpec[FontSizeVal]
type FontSizeArg = FieldName | FontSizeVal | Sequence[FontSizeVal] | FontSizeSpec | StringArray

type FontStyleVal = FontStyle
type FontStyleSpec = DataSpec[FontStyleVal]
type FontStyleArg = FieldName | FontStyleVal | Sequence[FontStyleVal] | FontStyleSpec | StringArray

type TextAlignVal = TextAlign
type TextAlignSpec = DataSpec[TextAlignVal]
type TextAlignArg = FieldName | TextAlignVal | Sequence[TextAlignVal] | TextAlignSpec | StringArray

type TextBaselineVal = TextBaseline
type TextBaselineSpec = DataSpec[TextBaselineVal]
type TextBaselineArg = FieldName | TextBaselineVal | Sequence[TextBaselineVal] | TextBaselineSpec | StringArray

type LineJoinVal = LineJoin
type LineJoinSpec = DataSpec[LineJoinVal]
type LineJoinArg = FieldName | LineJoinVal | Sequence[LineJoinVal] | LineJoinSpec | StringArray

type LineCapVal = LineCap
type LineCapSpec = DataSpec[LineCapVal]
type LineCapArg = FieldName | LineCapVal | Sequence[LineCapVal] | LineCapSpec | StringArray

type DashPatternVal = DashPattern
type DashPatternSpec = DataSpec[DashPatternVal]
type DashPatternArg = FieldName | DashPatternVal | Sequence[DashPatternVal] | DashPatternSpec | StringArray

type HatchPatternVal = HatchPattern | None
type HatchPatternSpec = DataSpec[HatchPatternVal]
type HatchPatternArg = FieldName | HatchPatternVal | Sequence[HatchPatternVal] | HatchPatternSpec | StringArray

type MarkerVal = MarkerType | str
type MarkerSpec = DataSpec[MarkerVal]
type MarkerArg = FieldName | MarkerVal | Sequence[MarkerVal] | MarkerSpec | StringArray

type TextAnchorVal = TextAnchor
type TextAnchorSpec = DataSpec[TextAnchorVal]
type TextAnchorArg = FieldName | TextAnchorVal | Sequence[TextAnchorVal] | TextAnchorSpec | StringArray

type OutlineShapeNameVal = OutlineShapeName
type OutlineShapeNameSpec = DataSpec[OutlineShapeNameVal]
type OutlineShapeNameArg = FieldName | OutlineShapeNameVal | Sequence[OutlineShapeNameVal] | OutlineShapeNameSpec | StringArray

type AngleVal = float
type AngleSpec = UnitsSpec[AngleVal, AngleUnits]
type AngleArg = FieldName | AngleVal | Sequence[AngleVal] | AngleSpec | FloatArray

type CoordinateVal = float | Datetime | TimeDelta
type CoordinateSpec = UnitsSpec[float | Datetime | TimeDelta, CoordinateUnits]
type CoordinateArg = FieldName | CoordinateVal | CoordinateSpec | Sequence[CoordinateVal] | NumberArray

type DistanceVal = NonNegative[float] | Datetime | TimeDelta
type DistanceSpec = UnitsSpec[DistanceVal, SpatialUnits]
type DistanceArg = FieldName | DistanceVal | DistanceSpec | Sequence[DistanceVal] | NumberArray

type NullDistanceVal = DistanceVal | None
type NullDistanceSpec = UnitsSpec[NullDistanceVal, SpatialUnits]
type NullDistanceArg = FieldName | NullDistanceVal | NullDistanceSpec | Sequence[NullDistanceVal] | NumberArray
