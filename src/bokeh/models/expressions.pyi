#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Sequence, Unpack

# Bokeh imports
from .._specs import AngleSpec, NumberSpec
from ..core.enums import DirectionType as Direction
from ..model.model import Model, ModelInit

class ExpressionInit(ModelInit, total=False):
    ...

class Expression(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ExpressionInit]) -> None: ...

class CustomJSExprInit(ExpressionInit, total=False):
    args: dict[str, Any]
    code: str

class CustomJSExpr(Expression):
    def __init__(self, **kwargs: Unpack[CustomJSExprInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...

class CumSumInit(ExpressionInit, total=False):
    field: str
    include_zero: bool

class CumSum(Expression):
    def __init__(self, **kwargs: Unpack[CumSumInit]) -> None: ...

    field: str = ...
    include_zero: bool = ...

class StackInit(ExpressionInit, total=False):
    fields: Sequence[str]

class Stack(Expression):
    def __init__(self, **kwargs: Unpack[StackInit]) -> None: ...

    fields: Sequence[str] = ...

class ScalarExpressionInit(ModelInit, total=False):
    ...

class ScalarExpression(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ScalarExpressionInit]) -> None: ...

class MinimumInit(ScalarExpressionInit, total=False):
    field: str
    initial: float | None

class Minimum(ScalarExpression):
    def __init__(self, **kwargs: Unpack[MinimumInit]) -> None: ...

    field: str = ...
    initial: float | None = ...

class MaximumInit(ScalarExpressionInit, total=False):
    field: str
    initial: float | None

class Maximum(ScalarExpression):
    def __init__(self, **kwargs: Unpack[MaximumInit]) -> None: ...

    field: str = ...
    initial: float | None = ...

class CoordinateTransformInit(ExpressionInit, total=False):
    ...

class CoordinateTransform(Expression):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[CoordinateTransformInit]) -> None: ...

    @property
    def x(self) -> XComponent: ...
    @property
    def y(self) -> YComponent: ...

class PolarTransformInit(CoordinateTransformInit, total=False):
    radius: NumberSpec
    angle: AngleSpec
    direction: Direction

class PolarTransform(CoordinateTransform):
    def __init__(self, **kwargs: Unpack[PolarTransformInit]) -> None: ...

    radius: NumberSpec = ...
    angle: AngleSpec = ...
    direction: Direction = ...

class XYComponentInit(ExpressionInit, total=False):
    transform: CoordinateTransform

class XYComponent(Expression):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[XYComponentInit]) -> None: ...

    transform: CoordinateTransform = ...

class XComponentInit(XYComponentInit, total=False):
    ...

class XComponent(XYComponent):
    def __init__(self, **kwargs: Unpack[XComponentInit]) -> None: ...

class YComponentInit(XYComponentInit, total=False):
    ...

class YComponent(XYComponent):
    def __init__(self, **kwargs: Unpack[YComponentInit]) -> None: ...
