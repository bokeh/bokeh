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
from typing import TYPE_CHECKING, Any, Literal

# Bokeh imports
from ...util.dataclasses import NotRequired, Unspecified
from ..serialization import (
    AnyRep,
    Deserializer,
    Serializable,
    Serializer,
)
from .wrappers import PropertyValueContainer

if TYPE_CHECKING:
    from ...models.expressions import Expression
    from ...models.transforms import Transform

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "DataSpecValue",
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

type DataSpecType = Literal["value", "field", "expr"]

@dataclass
class DataSpecValue[T](PropertyValueContainer, Serializable):
    """A source and optional modifiers for a :class:`~bokeh.core.properties.DataSpec`.

    DataSpec values are mutable owner-aware records. Changing ``value``,
    ``transform``, or ``units`` on a record assigned to a Bokeh model emits the
    same property change notification as assigning the complete record.
    """

    value: T
    transform: NotRequired[Transform] = Unspecified
    units: NotRequired[str] = Unspecified

    def __post_init__(self) -> None:
        PropertyValueContainer.__init__(self)

    @property
    def type(self) -> DataSpecType:
        raise NotImplementedError

    def to_serializable(self, serializer: Serializer) -> AnyRep:
        return serializer.encode_struct(type=self.type, value=self.value, transform=self.transform, units=self.units)

    def __copy__(self) -> DataSpecValue[T]:
        return self.__class__(self.value, self.transform, self.units)

    def _saved_copy(self) -> DataSpecValue[T]:
        return self.__copy__()

    def __setattr__(self, name: str, value: Any) -> None:
        if name in {"value", "transform", "units"} and hasattr(self, "_owners"):
            old = self._saved_copy()
            object.__setattr__(self, name, value)
            try:
                self._notify_owners(old)
            except Exception:
                object.__setattr__(self, name, getattr(old, name))
                raise
        else:
            object.__setattr__(self, name, value)

    def __delattr__(self, name: str) -> None:
        if name in {"type", "value"}:
            raise AttributeError(f"DataSpec.{name} cannot be deleted")
        elif name in {"transform", "units"}:
            setattr(self, name, Unspecified)
        else:
            object.__delattr__(self, name)

    @classmethod
    def from_serializable(cls, rep: dict[str, AnyRep], deserializer: Deserializer) -> DataSpecValue[Any]:
        if "value" not in rep:
            deserializer.error("expected 'value' field")
        value = deserializer.decode(rep["value"])
        transform = deserializer.decode(rep["transform"]) if "transform" in rep else Unspecified
        units = deserializer.decode(rep["units"]) if "units" in rep else Unspecified
        return cls(value, transform, units)

    def __getitem__(self, key: str) -> Any:
        if key == "type":
            return self.type
        elif key == "value":
            return self.value
        elif key == "transform" and self.transform is not Unspecified:
            return self.transform
        elif key == "units" and self.units is not Unspecified:
            return self.units
        raise KeyError(f"key '{key}' not found")

class Value[T](DataSpecValue[T]):
    """A literal DataSpec value.

    Use :func:`value` to construct instances in application code.
    """

    @property
    def type(self) -> Literal["value"]:
        return "value"


class Field(DataSpecValue[str]):
    """A DataSpec value read from a ``ColumnDataSource`` field.

    Use :func:`field` to construct instances in application code.
    """

    @property
    def type(self) -> Literal["field"]:
        return "field"


class Expr(DataSpecValue[Any]):
    """A DataSpec value computed by a client-side expression.

    Use :func:`expr` to construct instances in application code.
    """

    @property
    def type(self) -> Literal["expr"]:
        return "expr"


type Vectorized = Value[Any] | Field | Expr


def value[T](value: T, transform: NotRequired[Transform] = Unspecified, *, units: NotRequired[str] = Unspecified) -> Value[T]:
    """Create a literal DataSpec value.

    Args:
        value: The literal value to use.
        transform: An optional client-side transform.
        units: Optional units for a DataSpec configured with units.

    """
    return Value(value, transform, units)


def field(field_name: str, transform: NotRequired[Transform] = Unspecified, *, units: NotRequired[str] = Unspecified) -> Field:
    """Create a DataSpec value that reads from a ``ColumnDataSource`` field.

    Args:
        field_name: The name of the data source field.
        transform: An optional client-side transform.
        units: Optional units for a DataSpec configured with units.

    """
    return Field(field_name, transform, units)


def expr(expression: Expression, transform: NotRequired[Transform] = Unspecified, *, units: NotRequired[str] = Unspecified) -> Expr:
    """Create a DataSpec value computed by a client-side expression.

    Args:
        expression: The expression to evaluate in the browser.
        transform: An optional client-side transform applied to its result.
        units: Optional units for a DataSpec configured with units.

    """
    return Expr(expression, transform, units)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Deserializer.register("value", Value.from_serializable)
Deserializer.register("field", Field.from_serializable)
Deserializer.register("expr", Expr.from_serializable)
