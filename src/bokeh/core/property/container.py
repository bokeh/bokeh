#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""

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
from collections.abc import (
    Container,
    Iterable,
    Mapping,
    Sequence,
    Sized,
)
from typing import (
    TYPE_CHECKING,
    Any,
    cast,
    overload,
)

# Bokeh imports
from ._sphinx import property_link, register_type_link, type_link
from .any import Any as AnyVal
from .bases import (
    ContainerProperty,
    Init,
    Property,
    SingleParameterizedProperty,
    TypeOrInst,
)
from .descriptors import ColumnDataPropertyDescriptor
from .enum import Enum
from .numeric import Int
from .singletons import Intrinsic, Undefined
from .wrappers import (
    PropertyValueColumnData,
    PropertyValueDict,
    PropertyValueList,
    PropertyValueSet,
)

if TYPE_CHECKING:
    from ...document.events import DocumentPatchedEvent
    from ...models.sources import ColumnDataSource

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Array',
    'ColumnData',
    'Dict',
    'Len',
    'List',
    'NonEmpty',
    'RelativeDelta',
    'RestrictedDict',
    'Seq',
    'Set',
    'Tuple',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Seq[T, TSeq](ContainerProperty[TSeq]):
    """ Accept non-string ordered sequences of values, e.g. list, tuple, array.

    """

    def __init__(self, item_type: TypeOrInst[Property[T]], *, default: Init[TSeq] = Undefined, help: str | None = None) -> None:
        super().__init__(item_type, default=default, help=help)

    @property
    def item_type(self) -> Property[T]:
        return self.type_params[0]

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, True)

        if not self._is_seq(value):
            msg = "" if not detail else f"expected sequence {self}, got {value!r} of type {type(value)!r}"
            raise ValueError(msg)

        if self._should_skip_item_validation() or all(self.item_type.is_valid(item) for item in value):
            return

        if self._is_seq(value):
            invalid = []
            for item in value:
                if not self.item_type.is_valid(item):
                    invalid.append(item)
            msg = "" if not detail else f"expected an element of {self}, got seq with invalid items {invalid!r}"
            raise ValueError(msg)

        msg = "" if not detail else f"expected an element of {self}, got {value!r}"
        raise ValueError(msg)

    def _should_skip_item_validation(self) -> bool:
        return isinstance(self.item_type, AnyVal)

    @classmethod
    def _is_seq(cls, value: Any) -> bool:
        return ((isinstance(value, Sequence) or cls._is_seq_like(value)) and not isinstance(value, str))

    @classmethod
    def _is_seq_like(cls, value: Any) -> bool:
        return (isinstance(value, (Container, Sized, Iterable))
                and hasattr(value, "__getitem__") # NOTE: this is what makes it disallow set type
                and not isinstance(value, Mapping))

class List[T](Seq[T, list[T]]):
    """ Accept Python list values.

    """

    def __init__(self, item_type: TypeOrInst[Property[T]], *, default: Init[list[T]] = [], help: str | None = None) -> None:
        # TODO: refactor to not use mutable objects as default values.
        # Left in place for now because we want to allow None to express
        # optional values. Also in Dict.
        super().__init__(item_type, default=default, help=help)

    @overload
    def wrap(self, value: list[T]) -> PropertyValueList[T]: ...
    @overload
    def wrap[V](self, value: V) -> V: ...

    def wrap(self, value: Any) -> Any:
        """ Some property types need to wrap their values in special containers, etc.

        """
        if isinstance(value, list):
            if isinstance(value, PropertyValueList):
                return value
            else:
                return PropertyValueList(value)
        else:
            return value

    @classmethod
    def _is_seq(cls, value: Any) -> bool:
        return isinstance(value, list)

class Set[T](Seq[T, set[T]]):
    """ Accept Python ``set()`` values.

    """

    def __init__(self, item_type: TypeOrInst[Property[T]], *, default: Init[set[T]] = set(), help: str | None = None) -> None:
        # TODO: refactor to not use mutable objects as default values.
        # Left in place for now because we want to allow None to express
        # optional values. Also in Dict.
        super().__init__(item_type, default=default, help=help)

    @overload
    def wrap(self, value: set[T]) -> PropertyValueSet[T]: ...
    @overload
    def wrap[V](self, value: V) -> V: ...

    def wrap(self, value: Any) -> Any:
        """ Some property types need to wrap their values in special containers, etc. """
        if isinstance(value, set):
            if isinstance(value, PropertyValueSet):
                return value
            else:
                return PropertyValueSet(value)
        else:
            return value

    @classmethod
    def _is_seq(cls, value: Any) -> bool:
        return isinstance(value, set)

class Array[T](Seq[T, Any]):
    """ Accept NumPy array values.

    """

    @classmethod
    def _is_seq(cls, value: Any) -> bool:
        import numpy as np
        return isinstance(value, np.ndarray)

class Dict[K, V](ContainerProperty[dict[K, V]]):
    """ Accept Python dict values.

    If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.

    """

    def __init__(self, keys_type: TypeOrInst[Property[K]], values_type: TypeOrInst[Property[V]], *,
            default: Init[dict[K, V]] = {}, help: str | None = None) -> None:
        super().__init__(keys_type, values_type, default=default, help=help)

    @property
    def keys_type(self) -> Property[K]:
        return self.type_params[0]

    @property
    def values_type(self) -> Property[V]:
        return self.type_params[1]

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        key_is_valid = self.keys_type.is_valid
        value_is_valid = self.values_type.is_valid
        expected = f"expected a dict of type {self}"

        if not isinstance(value, dict):
            raise ValueError(f"{expected}, got a value of type {type(value)}" if detail else "")

        bad_keys = [str(k) for k in value if not key_is_valid(k)]
        bad_value_keys = [str(k) for (k, v) in value.items() if not value_is_valid(v)]
        exception_header = f"{expected}, got a dict with"
        bad_keys_str = f"invalid keys: {', '.join(bad_keys)}"
        bad_value_keys_str = f"invalid values for keys: {', '.join(bad_value_keys)}"
        err = None
        if (has_bad_keys := any(bad_keys)) & (has_bad_key_values := any(bad_value_keys)):
            err = ValueError(f"{exception_header} {bad_keys_str} and {bad_value_keys_str}")
        elif has_bad_keys:
            err = ValueError(f"{exception_header} {bad_keys_str}")
        elif has_bad_key_values:
            err = ValueError(f"{exception_header} {bad_value_keys_str}")
        if err:
            raise err if detail else ValueError("")

    @overload
    def wrap(self, value: dict[K, V]) -> PropertyValueDict[V]: ...
    @overload
    def wrap[T](self, value: T) -> T: ...

    def wrap(self, value: Any) -> Any:
        """ Some property types need to wrap their values in special containers, etc.

        """
        if isinstance(value, dict):
            if isinstance(value, PropertyValueDict):
                return value
            else:
                return PropertyValueDict(value)
        else:
            return value

class ColumnData(Dict[str, Any]):
    """ Accept a Python dictionary suitable as the ``data`` attribute of a
    :class:`~bokeh.models.sources.ColumnDataSource`.

    This class is a specialization of ``Dict`` that handles efficiently
    encoding columns that are NumPy arrays.

    """

    def make_descriptor(self, name: str) -> ColumnDataPropertyDescriptor:
        """Return the descriptor used to delegate access to column data.

        Args:
            name (str) : the name of the property these descriptors are for

        Returns:
            ColumnDataPropertyDescriptor
        """
        return ColumnDataPropertyDescriptor(name, self)

    def _hinted_value(self, value: Any, hint: DocumentPatchedEvent | None) -> Any:
        from ...document.events import ColumnDataChangedEvent, ColumnsStreamedEvent
        if isinstance(hint, ColumnDataChangedEvent):
            return { col: cast("ColumnDataSource", hint.model).data[col] for col in hint.cols or [] }
        if isinstance(hint, ColumnsStreamedEvent):
            return hint.data
        return value

    @overload
    def wrap(self, value: dict[str, Sequence[Any]]) -> PropertyValueColumnData: ...
    @overload
    def wrap[T](self, value: T) -> T: ...

    def wrap(self, value: Any) -> Any:
        """ Some property types need to wrap their values in special containers, etc.

        """
        if isinstance(value, dict):
            if isinstance(value, PropertyValueColumnData):
                return value
            else:
                return PropertyValueColumnData(value)
        else:
            return value

class Tuple(ContainerProperty[Any]):
    """ Accept Python tuple values.

    """

    def __init__(self, *type_params: TypeOrInst[Property[Any]], default: Init[Any] = Undefined, help: str | None = None) -> None:
        super().__init__(*type_params, default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if isinstance(value, (tuple, list)) and len(self.type_params) == len(value):
            if all(type_param.is_valid(item) for type_param, item in zip(self.type_params, value)):
                return

        msg = "" if not detail else f"expected an element of {self}, got {value!r}"
        raise ValueError(msg)

    def transform(self, value: Any) -> tuple[Any, ...]:
        """ Change the value into a JSON serializable format.

        """
        return tuple(typ.transform(x) for (typ, x) in zip(self.type_params, value))

class RelativeDelta(Dict[str, int]):
    """ Accept RelativeDelta dicts for time delta values.

    """

    def __init__(self, default: Init[dict[str, int]] = {}, *, help: str | None = None) -> None:
        keys = Enum("years", "months", "days", "hours", "minutes", "seconds", "microseconds")
        values = Int
        super().__init__(keys, values, default=default, help=help)

    def __str__(self) -> str:
        return self.__class__.__name__

class RestrictedDict[K, V](Dict[K, V]):
    """ Check for disallowed key(s).

    """

    def __init__(self, keys_type: TypeOrInst[Property[Any]], values_type: TypeOrInst[Property[Any]], disallow: Iterable[Any],
            default: Init[dict[K, V]] = {}, *, help: str | None = None) -> None:
        self._disallow = set(disallow)
        super().__init__(keys_type=keys_type, values_type=values_type, default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        error_keys = self._disallow & value.keys()

        if error_keys:
            msg = "" if not detail else f"Disallowed keys: {error_keys!r}"
            raise ValueError(msg)

class NonEmpty[TSeq: Seq[Any, Any]](SingleParameterizedProperty[TSeq]):
    """ Allows only non-empty containers. """

    def __init__(self, type_param: TypeOrInst[TSeq], *, default: Init[TSeq] = Intrinsic,
            help: str | None = None) -> None:
        super().__init__(type_param, default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if not value:
            msg = "" if not detail else "Expected a non-empty container"
            raise ValueError(msg)

class Len[TSeq: Seq[Any, Any]](SingleParameterizedProperty[TSeq]):
    """ Allows only containers of the given length. """

    def __init__(self, type_param: TypeOrInst[TSeq], length: int, *, default: Init[TSeq] = Intrinsic,
            help: str | None = None) -> None:
        super().__init__(type_param, default=default, help=help)
        self.length = length

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if len(value) != self.length:
            msg = "" if not detail else f"Expected a container of length #{self.length}, got #{len(value)}"
            raise ValueError(msg)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

@register_type_link(Dict)
def _sphinx_type_dict(obj: Dict[Any, Any]) -> str:
    return f"{property_link(obj)}({type_link(obj.keys_type)}, {type_link(obj.values_type)})"

@register_type_link(Seq)
def _sphinx_type_seq(obj: Seq[Any, Any]) -> str:
    return f"{property_link(obj)}({type_link(obj.item_type)})"

@register_type_link(Tuple)
def _sphinx_type_tuple(obj: Tuple) -> str:
    item_types = ", ".join(type_link(x) for x in obj.type_params)
    return f"{property_link(obj)}({item_types})"
