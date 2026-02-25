#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Any, Sequence

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from .._specs import AngleSpec, NumberSpec
from ..core.enums import DirectionType as Direction
from ..model.model import Model

from ..model.model import JSEventCallback
from typing import TypedDict

class _ExpressionInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class Expression(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ExpressionInit]) -> None: ...

class _CustomJSExprInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    args: dict[str, Any]
    code: str

class CustomJSExpr(Expression):
    def __init__(self, **kwargs: Unpack[_CustomJSExprInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...

class _CumSumInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    field: str
    include_zero: bool

class CumSum(Expression):
    def __init__(self, **kwargs: Unpack[_CumSumInit]) -> None: ...

    field: str = ...
    include_zero: bool = ...

class _StackInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    fields: Sequence[str]

class Stack(Expression):
    def __init__(self, **kwargs: Unpack[_StackInit]) -> None: ...

    fields: Sequence[str] = ...

class _ScalarExpressionInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class ScalarExpression(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ScalarExpressionInit]) -> None: ...

class _MinimumInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    field: str
    initial: float | None

class Minimum(ScalarExpression):
    def __init__(self, **kwargs: Unpack[_MinimumInit]) -> None: ...

    field: str = ...
    initial: float | None = ...

class _MaximumInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    field: str
    initial: float | None

class Maximum(ScalarExpression):
    def __init__(self, **kwargs: Unpack[_MaximumInit]) -> None: ...

    field: str = ...
    initial: float | None = ...

class _CoordinateTransformInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class CoordinateTransform(Expression):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CoordinateTransformInit]) -> None: ...

    @property
    def x(self) -> XComponent: ...
    @property
    def y(self) -> YComponent: ...

class _PolarTransformInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    radius: NumberSpec
    angle: AngleSpec
    direction: Direction

class PolarTransform(CoordinateTransform):
    def __init__(self, **kwargs: Unpack[_PolarTransformInit]) -> None: ...

    radius: NumberSpec = ...
    angle: AngleSpec = ...
    direction: Direction = ...

class _XYComponentInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    transform: CoordinateTransform

class XYComponent(Expression):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_XYComponentInit]) -> None: ...

    transform: CoordinateTransform = ...

class _XComponentInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    transform: CoordinateTransform

class XComponent(XYComponent):
    def __init__(self, **kwargs: Unpack[_XComponentInit]) -> None: ...

class _YComponentInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    transform: CoordinateTransform

class YComponent(XYComponent):
    def __init__(self, **kwargs: Unpack[_YComponentInit]) -> None: ...
