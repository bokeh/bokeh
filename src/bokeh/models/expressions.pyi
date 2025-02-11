#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Any, Sequence

# Bokeh imports
from .._specs import AngleSpec, NumberSpec
from ..core.enums import DirectionType as Direction
from ..core.has_props import abstract
from ..model import Model

@abstract
@dataclass(init=False)
class Expression(Model):
    ...

@dataclass
class CustomJSExpr(Expression):

    args: dict[str, Any] = ...

    code: str = ...

@dataclass
class CumSum(Expression):

    field: str = ...

    include_zero: bool = ...

@dataclass
class Stack(Expression):

    fields: Sequence[str] = ...

@abstract
@dataclass(init=False)
class ScalarExpression(Model):
    ...

@dataclass
class Minimum(ScalarExpression):

    field: str
    initial: float | None

@dataclass
class Maximum(ScalarExpression):

    field: str
    initial: float | None

@abstract
@dataclass(init=False)
class CoordinateTransform(Expression):

    @property
    def x(self) -> XComponent: ...

    @property
    def y(self) -> YComponent: ...

@dataclass
class PolarTransform(CoordinateTransform):

    radius: NumberSpec = ...

    angle: AngleSpec = ...

    direction: Direction = ...

@abstract
@dataclass(init=False)
class XYComponent(Expression):

    transform: CoordinateTransform = ...

@dataclass
class XComponent(XYComponent):
    ...

@dataclass
class YComponent(XYComponent):
    ...
