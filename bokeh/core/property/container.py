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
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ...util.serialization import decode_base64_dict, transform_column_source_data
from ._sphinx import property_link, register_type_link, type_link
from .bases import ContainerProperty, DeserializationError
from .descriptors import ColumnDataPropertyDescriptor
from .enum import Enum
from .numeric import Int
from .singletons import Undefined
from .wrappers import PropertyValueColumnData, PropertyValueDict, PropertyValueList

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
    'RelativeDelta',
    'RestrictedDict',
    'Seq',
    'Tuple',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Seq(ContainerProperty):
    """ Accept non-string ordered sequences of values, e.g. list, tuple, array.

    """

    def __init__(self, item_type, default=Undefined, help=None) -> None:
        self.item_type = self._validate_type_param(item_type)
        super().__init__(default=default, help=help)

    def __str__(self) -> str:
        return f"{self.__class__.__name__}({self.item_type})"

    @property
    def type_params(self):
        return [self.item_type]

    def from_json(self, json, *, models=None):
        if isinstance(json, list):
            return self._new_instance([ self.item_type.from_json(item, models=models) for item in json ])
        else:
            raise DeserializationError(f"{self} expected a list, got {json}")

    def validate(self, value, detail=True):
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
    def _is_seq(cls, value):
        return ((isinstance(value, Sequence) or cls._is_seq_like(value)) and
                not isinstance(value, str))

    @classmethod
    def _is_seq_like(cls, value):
        return (isinstance(value, (Container, Sized, Iterable))
                and hasattr(value, "__getitem__") # NOTE: this is what makes it disallow set type
                and not isinstance(value, Mapping))

    def _new_instance(self, value):
        return value

class List(Seq):
    """ Accept Python list values.

    """

    def __init__(self, item_type, default=[], help=None) -> None:
        # todo: refactor to not use mutable objects as default values.
        # Left in place for now because we want to allow None to express
        # optional values. Also in Dict.
        super().__init__(item_type, default=default, help=help)

    def wrap(self, value):
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
    def _is_seq(cls, value):
        return isinstance(value, list)

class Array(Seq):
    """ Accept NumPy array values.

    """

    @classmethod
    def _is_seq(cls, value):
        import numpy as np
        return isinstance(value, np.ndarray)

    def _new_instance(self, value):
        import numpy as np
        return np.array(value)


class Dict(ContainerProperty):
    """ Accept Python dict values.

    If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.

    """

    def __init__(self, keys_type, values_type, default={}, help=None) -> None:
        self.keys_type = self._validate_type_param(keys_type)
        self.values_type = self._validate_type_param(values_type)
        super().__init__(default=default, help=help)

    def __str__(self) -> str:
        return f"{self.__class__.__name__}({self.keys_type}, {self.values_type})"

    @property
    def type_params(self):
        return [self.keys_type, self.values_type]

    def from_json(self, json, *, models=None):
        if isinstance(json, dict):
            return { self.keys_type.from_json(key, models=models): self.values_type.from_json(value, models=models) for key, value in json.items() }
        else:
            raise DeserializationError(f"{self} expected a dict, got {json}")

    def validate(self, value, detail=True):
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


    def from_json(self, json, *, models=None):
        """ Decodes column source data encoded as lists or base64 strings.
        """
        if not isinstance(json, dict):
            raise DeserializationError(f"{self} expected a dict, got {json}")
        new_data = {}
        for key, value in json.items():
            key = self.keys_type.from_json(key, models=models)
            if isinstance(value, dict) and '__ndarray__' in value:
                new_data[key] = decode_base64_dict(value)
            elif isinstance(value, list) and any(isinstance(el, dict) and '__ndarray__' in el for el in value):
                new_list = []
                for el in value:
                    if isinstance(el, dict) and '__ndarray__' in el:
                        el = decode_base64_dict(el)
                    elif isinstance(el, list):
                        el = self.values_type.from_json(el)
                    new_list.append(el)
                new_data[key] = new_list
            else:
                new_data[key] = self.values_type.from_json(value, models=models)
        return new_data

    def _hinted_value(self, value: Any, hint: DocumentPatchedEvent | None) -> Any:
        from ...document.events import ColumnDataChangedEvent, ColumnsStreamedEvent
        if isinstance(hint, ColumnDataChangedEvent):
            return { col: hint.column_source.data[col] for col in hint.cols }
        if isinstance(hint, ColumnsStreamedEvent):
            return hint.data
        return value

    def serialize_value(self, value):
        return transform_column_source_data(value)

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
    def __init__(self, tp1, tp2, *type_params, **kwargs) -> None:
        self._type_params = list(map(self._validate_type_param, (tp1, tp2) + type_params))
        super().__init__(default=kwargs.get("default", Undefined), help=kwargs.get("help"))

    def __str__(self) -> str:
        item_types = ", ".join(str(x) for x in self.type_params)
        return f"{self.__class__.__name__}({item_types})"

    @property
    def type_params(self):
        return self._type_params

    def from_json(self, json, *, models=None):
        if isinstance(json, list):
            return tuple(type_param.from_json(item, models=models) for type_param, item in zip(self.type_params, json))
        else:
            raise DeserializationError(f"{self} expected a list, got {json}")

    def validate(self, value, detail=True):
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

    def serialize_value(self, value):
        """ Change the value into a JSON serializable format.

        """
        return tuple(typ.serialize_value(x) for (typ, x) in zip(self.type_params, value))

class RelativeDelta(Dict):
    """ Accept RelativeDelta dicts for time delta values.

    """

    def __init__(self, default={}, help=None) -> None:
        keys = Enum("years", "months", "days", "hours", "minutes", "seconds", "microseconds")
        values = Int
        super().__init__(keys, values, default=default, help=help)

    def __str__(self) -> str:
        return self.__class__.__name__

class RestrictedDict(Dict):
    """ Check for disallowed key(s).

    """

    def __init__(self, keys_type, values_type, disallow, default={}, help=None) -> None:
        self._disallow = set(disallow)
        super().__init__(keys_type=keys_type, values_type=values_type, default=default, help=help)

    def validate(self, value, detail=True):
        super().validate(value, detail)

        error_keys = self._disallow & value.keys()

        if error_keys:
            msg = "" if not detail else f"Disallowed keys: {error_keys!r}"
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
def _sphinx_type_dict(obj):
    return f"{property_link(obj)}({type_link(obj.keys_type)}, {type_link(obj.values_type)})"

@register_type_link(Seq)
def _sphinx_type_seq(obj):
    return f"{property_link(obj)}({type_link(obj.item_type)})"

@register_type_link(Tuple)
def _sphinx_type_tuple(obj):
    item_types = ", ".join(type_link(x) for x in obj.type_params)
    return f"{property_link(obj)}({item_types})"
