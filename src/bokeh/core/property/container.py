#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from typing import TYPE_CHECKING, Any, TypeVar

# Bokeh imports
from ._sphinx import property_link, register_type_link, type_link
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

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Array',
    'ColumnData',
    'Dict',
    'List',
    'NonEmpty',
    'RelativeDelta',
    'RestrictedDict',
    'Seq',
    'Set',
    'Tuple',
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Seq(ContainerProperty[T]):
    """ Accept non-string ordered sequences of values, e.g. list, tuple, array.

    """

    def __init__(self, item_type: TypeOrInst[Property[T]], *, default: Init[T] = Undefined, help: str | None = None) -> None:
        super().__init__(item_type, default=default, help=help)

    @property
    def item_type(self):
        return self.type_params[0]

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, True)

        if self._is_seq(value) and all(self.item_type.is_valid(item) for item in value):
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

    @classmethod
    def _is_seq(cls, value: Any) -> bool:
        return ((isinstance(value, Sequence) or cls._is_seq_like(value)) and not isinstance(value, str))

    @classmethod
    def _is_seq_like(cls, value: Any) -> bool:
        return (isinstance(value, (Container, Sized, Iterable))
                and hasattr(value, "__getitem__") # NOTE: this is what makes it disallow set type
                and not isinstance(value, Mapping))

class List(Seq[T]):
    """ Accept Python list values.

    """

    def __init__(self, item_type: TypeOrInst[Property[T]], *, default: Init[T] = [], help: str | None = None) -> None:
        # TODO: refactor to not use mutable objects as default values.
        # Left in place for now because we want to allow None to express
        # optional values. Also in Dict.
        super().__init__(item_type, default=default, help=help)

    def wrap(self, value: list[T]) -> PropertyValueList[T]:
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
    def _is_seq(cls, value: Any):
        return isinstance(value, list)

class Set(Seq[T]):
    """ Accept Python ``set()`` values.

    """

    def __init__(self, item_type: TypeOrInst[Property[T]], *, default: Init[T] = set(), help: str | None = None) -> None:
        # TODO: refactor to not use mutable objects as default values.
        # Left in place for now because we want to allow None to express
        # optional values. Also in Dict.
        super().__init__(item_type, default=default, help=help)

    def wrap(self, value: set[T]) -> PropertyValueSet[T]:
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

class Array(Seq[T]):
    """ Accept NumPy array values.

    """

    @classmethod
    def _is_seq(cls, value: Any) -> bool:
        import numpy as np
        return isinstance(value, np.ndarray)

class Dict(ContainerProperty[Any]):
    """ Accept Python dict values.

    If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.

    """

    def __init__(self, keys_type: TypeOrInst[Property[Any]], values_type: TypeOrInst[Property[Any]], *,
            default: Init[T] = {}, help: str | None = None) -> None:
        super().__init__(keys_type, values_type, default=default, help=help)

    @property
    def keys_type(self):
        return self.type_params[0]

    @property
    def values_type(self):
        return self.type_params[1]

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        key_is_valid = self.keys_type.is_valid
        value_is_valid = self.values_type.is_valid
        if isinstance(value, dict) and all(key_is_valid(key) and value_is_valid(val) for key, val in value.items()):
            return

        msg = "" if not detail else f"expected an element of {self}, got {value!r}"
        raise ValueError(msg)

    def wrap(self, value):
        """ Some property types need to wrap their values in special containers, etc.

        """
        if isinstance(value, dict):
            if isinstance(value, PropertyValueDict):
                return value
            else:
                return PropertyValueDict(value)
        else:
            return value

class ColumnData(Dict):
    """ Accept a Python dictionary suitable as the ``data`` attribute of a
    :class:`~bokeh.models.sources.ColumnDataSource`.

    This class is a specialization of ``Dict`` that handles efficiently
    encoding columns that are NumPy arrays.

    """

    def make_descriptors(self, base_name):
        """ Return a list of ``ColumnDataPropertyDescriptor`` instances to
        install on a class, in order to delegate attribute access to this
        property.

        Args:
            base_name (str) : the name of the property these descriptors are for

        Returns:
            list[ColumnDataPropertyDescriptor]

        The descriptors returned are collected by the ``MetaHasProps``
        metaclass and added to ``HasProps`` subclasses during class creation.
        """
        return [ ColumnDataPropertyDescriptor(base_name, self) ]

    def _hinted_value(self, value: Any, hint: DocumentPatchedEvent | None) -> Any:
        from ...document.events import ColumnDataChangedEvent, ColumnsStreamedEvent
        if isinstance(hint, ColumnDataChangedEvent):
            return { col: hint.model.data[col] for col in hint.cols }
        if isinstance(hint, ColumnsStreamedEvent):
            return hint.data
        return value

    def wrap(self, value):
        """ Some property types need to wrap their values in special containers, etc.

        """
        if isinstance(value, dict):
            if isinstance(value, PropertyValueColumnData):
                return value
            else:
                return PropertyValueColumnData(value)
        else:
            return value

class Tuple(ContainerProperty):
    """ Accept Python tuple values.

    """

    def __init__(self, *type_params: TypeOrInst[Property[Any]], default: Init[T] = Undefined, help: str | None = None) -> None:
        super().__init__(*type_params, default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if isinstance(value, (tuple, list)) and len(self.type_params) == len(value):
            if all(type_param.is_valid(item) for type_param, item in zip(self.type_params, value)):
                return

        msg = "" if not detail else f"expected an element of {self}, got {value!r}"
        raise ValueError(msg)

    def transform(self, value):
        """ Change the value into a JSON serializable format.

        """
        return tuple(typ.transform(x) for (typ, x) in zip(self.type_params, value))

class RelativeDelta(Dict):
    """ Accept RelativeDelta dicts for time delta values.

    """

    def __init__(self, default={}, *, help: str | None = None) -> None:
        keys = Enum("years", "months", "days", "hours", "minutes", "seconds", "microseconds")
        values = Int
        super().__init__(keys, values, default=default, help=help)

    def __str__(self) -> str:
        return self.__class__.__name__

class RestrictedDict(Dict):
    """ Check for disallowed key(s).

    """

    def __init__(self, keys_type, values_type, disallow, default={}, *, help: str | None = None) -> None:
        self._disallow = set(disallow)
        super().__init__(keys_type=keys_type, values_type=values_type, default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        error_keys = self._disallow & value.keys()

        if error_keys:
            msg = "" if not detail else f"Disallowed keys: {error_keys!r}"
            raise ValueError(msg)

TSeq = TypeVar("TSeq", bound=Seq[Any])

class NonEmpty(SingleParameterizedProperty[TSeq]):
    """ Allows only non-empty containers. """

    def __init__(self, type_param: TypeOrInst[TSeq], *, default: Init[TSeq] = Intrinsic,
            help: str | None = None) -> None:
        super().__init__(type_param, default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if not value:
            msg = "" if not detail else "Expected a non-empty container"
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
def _sphinx_type_dict(obj: Dict):
    return f"{property_link(obj)}({type_link(obj.keys_type)}, {type_link(obj.values_type)})"

@register_type_link(Seq)
def _sphinx_type_seq(obj: Seq[Any]):
    return f"{property_link(obj)}({type_link(obj.item_type)})"

@register_type_link(Tuple)
def _sphinx_type_tuple(obj: Tuple):
    item_types = ", ".join(type_link(x) for x in obj.type_params)
    return f"{property_link(obj)}({item_types})"
