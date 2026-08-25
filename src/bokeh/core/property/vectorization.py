#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Vectorization related data types used by dataspecs.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ...util.dataclasses import NotRequired, Unspecified
from ..serialization import (
    AnyRep,
    Deserializer,
    Serializable,
    Serializer,
)

if TYPE_CHECKING:
    from ...models.expressions import Expression
    from ...models.transforms import Transform

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Expr",
    "Field",
    "Value",
    "expr",
    "field",
    "value",
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@dataclass
class Value[T](Serializable):
    value: T
    transform: NotRequired[Transform] = Unspecified

    def to_serializable(self, serializer: Serializer) -> AnyRep:
        return serializer.encode_struct(type="value", value=self.value, transform=self.transform)

    @classmethod
    def from_serializable(cls, rep: dict[str, AnyRep], deserializer: Deserializer) -> Value[Any]:
        if "value" not in rep:
            deserializer.error("expected 'value' field")
        if "units" in rep:
            deserializer.error(
                "embedded 'units' are no longer supported in value specifications; "
                "set the owning model's companion '<property>_units' property instead",
            )
        value = deserializer.decode(rep["value"])
        transform = deserializer.decode(rep["transform"]) if "transform" in rep else Unspecified
        return Value(value, transform)

    def __getitem__(self, key: str) -> Any:
        if key == "value":
            return self.value
        elif key == "transform" and self.transform is not Unspecified:
            return self.transform
        raise KeyError(f"key '{key}' not found")

@dataclass
class Field(Serializable):
    field: str
    transform: NotRequired[Transform] = Unspecified

    def to_serializable(self, serializer: Serializer) -> AnyRep:
        return serializer.encode_struct(type="field", field=self.field, transform=self.transform)

    @classmethod
    def from_serializable(cls, rep: dict[str, AnyRep], deserializer: Deserializer) -> Field:
        if "field" not in rep:
            deserializer.error("expected 'field' field")
        if "units" in rep:
            deserializer.error(
                "embedded 'units' are no longer supported in field specifications; "
                "set the owning model's companion '<property>_units' property instead",
            )
        field = deserializer.decode(rep["field"])
        transform = deserializer.decode(rep["transform"]) if "transform" in rep else Unspecified
        return Field(field, transform)

    def __getitem__(self, key: str) -> Any:
        if key == "field":
            return self.field
        elif key == "transform" and self.transform is not Unspecified:
            return self.transform
        raise KeyError(f"key '{key}' not found")

@dataclass
class Expr(Serializable):
    expr: Expression
    transform: NotRequired[Transform] = Unspecified

    def to_serializable(self, serializer: Serializer) -> AnyRep:
        return serializer.encode_struct(type="expr", expr=self.expr, transform=self.transform)

    @classmethod
    def from_serializable(cls, rep: dict[str, AnyRep], deserializer: Deserializer) -> Expr:
        if "expr" not in rep:
            deserializer.error("expected 'expr' field")
        if "units" in rep:
            deserializer.error(
                "embedded 'units' are no longer supported in expression specifications; "
                "set the owning model's companion '<property>_units' property instead",
            )
        expr = deserializer.decode(rep["expr"])
        transform = deserializer.decode(rep["transform"]) if "transform" in rep else Unspecified
        return Expr(expr, transform)

    def __getitem__(self, key: str) -> Any:
        if key == "expr":
            return self.expr
        elif key == "transform" and self.transform is not Unspecified:
            return self.transform
        raise KeyError(f"key '{key}' not found")

type Vectorized = Value[Any] | Field | Expr

value = Value

field = Field

expr = Expr

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Deserializer.register("value", Value.from_serializable)
Deserializer.register("field", Field.from_serializable)
Deserializer.register("expr", Expr.from_serializable)
