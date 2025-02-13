#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    Generic,
    Never,
    NotRequired,
    Sequence,
    TypeAlias,
    TypedDict,
    TypeVar,
)

# External imports
import numpy as np
import numpy.typing as npt

# Bokeh imports
from ._types import (
    Color,
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
from .core.property.visual import DashPatternType as DashPattern
from .core.property_aliases import TextAnchorType as TextAnchor
from .models.expressions import Expression
from .models.transforms import Transform

FieldName: TypeAlias = str

ValueType = TypeVar("ValueType")
UnitsType = TypeVar("UnitsType")

class ValueDict(TypedDict, Generic[ValueType, UnitsType]):
    value: ValueType
    transform: NotRequired[Transform]
    units: NotRequired[UnitsType]

class FieldDict(TypedDict, Generic[ValueType, UnitsType]):
    field: FieldName
    transform: NotRequired[Transform]
    units: NotRequired[UnitsType]

class ExprDict(TypedDict, Generic[ValueType, UnitsType]):
    expr: Expression
    transform: NotRequired[Transform]
    units: NotRequired[UnitsType]

VectorInit: TypeAlias = Value[ValueType] | Field | Expr
VectorDict: TypeAlias = ValueDict[ValueType, UnitsType] | FieldDict[ValueType, UnitsType] | ExprDict[ValueType, UnitsType]
VectorLike: TypeAlias = VectorInit[ValueType] | VectorDict[ValueType, UnitsType]

Vectorized: TypeAlias = FieldName | ValueType | VectorLike[ValueType, UnitsType]

IntArray: TypeAlias = npt.NDArray[np.integer]
FloatArray: TypeAlias = npt.NDArray[np.floating]
NumberArray: TypeAlias = FloatArray | npt.NDArray[np.datetime64] | npt.NDArray[np.timedelta64]
Number1dArray: TypeAlias = NumberArray # TODO shape
Number2dArray: TypeAlias = NumberArray # TODO shape
Number3dArray: TypeAlias = NumberArray # TODO shape
StringArray: TypeAlias = npt.NDArray[np.str_]

T = TypeVar("T")
U = TypeVar("U")

DataSpec: TypeAlias = Vectorized[T, Never]
UnitsSpec: TypeAlias = Vectorized[T, U]

IntVal: TypeAlias = int
IntSpec: TypeAlias = DataSpec[IntVal]
IntArg: TypeAlias = FieldName | IntVal | IntSpec | Sequence[IntVal] | IntArray

FloatVal: TypeAlias = float
FloatSpec: TypeAlias = DataSpec[FloatVal]
FloatArg: TypeAlias = FieldName | FloatVal | FloatSpec | Sequence[FloatVal] | FloatArray

NumberVal: TypeAlias = float | Datetime | TimeDelta
NumberSpec: TypeAlias = DataSpec[NumberVal]
NumberArg: TypeAlias = FieldName | NumberVal | NumberSpec | Sequence[NumberVal] | NumberArray

Number1dVal: TypeAlias = Sequence[float | Datetime | TimeDelta]
Number1dSpec: TypeAlias = DataSpec[Number1dVal]
Number1dArg: TypeAlias = FieldName | Number1dVal | Number1dSpec | Sequence[Number1dVal] | Number1dArray

Number2dVal: TypeAlias = Sequence[Sequence[float | Datetime | TimeDelta]]
Number2dSpec: TypeAlias = DataSpec[Number2dVal]
Number2dArg: TypeAlias = FieldName | Number2dVal | Number2dSpec | Sequence[Number2dVal] | Number2dArray

Number3dVal: TypeAlias = Sequence[Sequence[Sequence[float | Datetime | TimeDelta]]]
Number3dSpec: TypeAlias = DataSpec[Number3dVal]
Number3dArg: TypeAlias = FieldName | Number3dVal | Number3dSpec | Sequence[Number3dVal] | Number3dArray

Image2dVal: TypeAlias = Number2dArray
Image2dSpec: TypeAlias = DataSpec[Image2dVal]
Image2dArg: TypeAlias = FieldName | Image2dSpec | Sequence[Image2dVal]

Image3dVal: TypeAlias = Number3dArray
Image3dSpec: TypeAlias = DataSpec[Image3dVal]
Image3dArg: TypeAlias = FieldName | Image3dSpec | Sequence[Image3dVal]

SizeVal: TypeAlias = NonNegative[float] | Datetime | TimeDelta
SizeSpec: TypeAlias = DataSpec[SizeVal]
SizeArg: TypeAlias = FieldName | SizeVal | Sequence[SizeVal] | SizeSpec | NumberArray

AlphaVal: TypeAlias = FloatVal
AlphaSpec: TypeAlias = FloatSpec
AlphaArg: TypeAlias = FloatArg

ColorVal: TypeAlias = Color | None
ColorSpec: TypeAlias = DataSpec[Color | None]
ColorArg: TypeAlias = FieldName | ColorVal | Sequence[ColorVal] | ColorSpec | npt.NDArray[np.uint8] # TODO

StringVal: TypeAlias = str
StringSpec: TypeAlias = DataSpec[StringVal]
StringArg: TypeAlias = FieldName | StringVal | Sequence[StringVal] | StringSpec | StringArray

NullStringVal: TypeAlias = StringVal | None
NullStringSpec: TypeAlias = DataSpec[NullStringVal]
NullStringArg: TypeAlias = FieldName | NullStringVal | Sequence[NullStringVal] | NullStringSpec | StringArray

FontSizeVal: TypeAlias = FontSize
FontSizeSpec: TypeAlias = DataSpec[FontSizeVal]
FontSizeArg: TypeAlias = FieldName | FontSizeVal | Sequence[FontSizeVal] | FontSizeSpec | StringArray

FontStyleVal: TypeAlias = FontStyle
FontStyleSpec: TypeAlias = DataSpec[FontStyleVal]
FontStyleArg: TypeAlias = FieldName | FontStyleVal | Sequence[FontStyleVal] | FontStyleSpec | StringArray

TextAlignVal: TypeAlias = TextAlign
TextAlignSpec: TypeAlias = DataSpec[TextAlignVal]
TextAlignArg: TypeAlias = FieldName | TextAlignVal | Sequence[TextAlignVal] | TextAlignSpec | StringArray

TextBaselineVal: TypeAlias = TextBaseline
TextBaselineSpec: TypeAlias = DataSpec[TextBaselineVal]
TextBaselineArg: TypeAlias = FieldName | TextBaselineVal | Sequence[TextBaselineVal] | TextBaselineSpec | StringArray

LineJoinVal: TypeAlias = LineJoin
LineJoinSpec: TypeAlias = DataSpec[LineJoinVal]
LineJoinArg: TypeAlias = FieldName | LineJoinVal | Sequence[LineJoinVal] | LineJoinSpec | StringArray

LineCapVal: TypeAlias = LineCap
LineCapSpec: TypeAlias = DataSpec[LineCapVal]
LineCapArg: TypeAlias = FieldName | LineCapVal | Sequence[LineCapVal] | LineCapSpec | StringArray

DashPatternVal: TypeAlias = DashPattern
DashPatternSpec: TypeAlias = DataSpec[DashPatternVal]
DashPatternArg: TypeAlias = FieldName | DashPatternVal | Sequence[DashPatternVal] | DashPatternSpec | StringArray

HatchPatternVal: TypeAlias = HatchPattern | None
HatchPatternSpec: TypeAlias = DataSpec[HatchPatternVal]
HatchPatternArg: TypeAlias = FieldName | HatchPatternVal | Sequence[HatchPatternVal] | HatchPatternSpec | StringArray

MarkerVal: TypeAlias = MarkerType | str
MarkerSpec: TypeAlias = DataSpec[MarkerVal]
MarkerArg: TypeAlias = FieldName | MarkerVal | Sequence[MarkerVal] | MarkerSpec | StringArray

TextAnchorVal: TypeAlias = TextAnchor
TextAnchorSpec: TypeAlias = DataSpec[TextAnchorVal]
TextAnchorArg: TypeAlias = FieldName | TextAnchorVal | Sequence[TextAnchorVal] | TextAnchorSpec | StringArray

OutlineShapeNameVal: TypeAlias = OutlineShapeName
OutlineShapeNameSpec: TypeAlias = DataSpec[OutlineShapeNameVal]
OutlineShapeNameArg: TypeAlias = FieldName | OutlineShapeNameVal | Sequence[OutlineShapeNameVal] | OutlineShapeNameSpec | StringArray

AngleVal: TypeAlias = float
AngleSpec: TypeAlias = UnitsSpec[AngleVal, AngleUnits]
AngleArg: TypeAlias = FieldName | AngleVal | Sequence[AngleVal] | AngleSpec | FloatArray

CoordinateVal: TypeAlias = float | Datetime | TimeDelta
CoordinateSpec: TypeAlias = UnitsSpec[float | Datetime | TimeDelta, CoordinateUnits]
CoordinateArg: TypeAlias = FieldName | CoordinateVal | CoordinateSpec | Sequence[CoordinateVal] | NumberArray

DistanceVal: TypeAlias = NonNegative[float] | Datetime | TimeDelta
DistanceSpec: TypeAlias = UnitsSpec[DistanceVal, SpatialUnits]
DistanceArg: TypeAlias = FieldName | DistanceVal | DistanceSpec | Sequence[DistanceVal] | NumberArray

NullDistanceVal: TypeAlias = DistanceVal | None
NullDistanceSpec: TypeAlias = UnitsSpec[NullDistanceVal, SpatialUnits]
NullDistanceArg: TypeAlias = FieldName | NullDistanceVal | NullDistanceSpec | Sequence[NullDistanceVal] | NumberArray
