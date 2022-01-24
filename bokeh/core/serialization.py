#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" """

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
import base64
import datetime as dt
import sys
from math import isinf, isnan
from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    List,
    Tuple,
    Type,
    TypedDict,
)

# External imports
import numpy as np

if TYPE_CHECKING:
    import numpy.typing as npt

# Bokeh imports
from ..util.dataclasses import dataclass, entries, is_dataclass
from ..util.dependencies import import_optional
from ..util.serialization import (
    array_encoding_disabled,
    convert_datetime_type,
    convert_timedelta_type,
    decode_base64_dict,
    is_datetime_type,
    is_timedelta_type,
    transform_array,
    transform_series,
)
from .types import ID, JSON, Ref

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Deserializer",
    "Serializer",
)

MAX_INT = 2**53 - 1

_serializers: Dict[Type[Any], Any] = {}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Reference(TypedDict):
    id: ID
    type: str
    attributes: Dict[str, Any]

@dataclass
class Buffer:
    id: ID
    data: bytes

    @property
    def ref(self) -> Ref:
        return Ref(id=self.id)

    def to_base64(self) -> str:
        return base64.b64encode(self.data).decode("utf-8")

class SerializationError(Exception):
    """ """

class Serializable:
    """ """

    def to_serializable(self, serializer: Serializer) -> JSON:
        """ """
        raise NotImplementedError()

class Serializer:
    """ """

    _references: Dict[Any, Reference]
    _buffers: List[Buffer]

    def __init__(self, *, binary: bool = True) -> None:
        self._references = {}
        self._buffers = []
        self.binary = binary

    def to_serializable(self, obj: Any) -> JSON:
        """ """
        return self._encode(obj)

    def has_ref(self, obj: Any) -> bool:
        return obj in self._references

    def add_ref(self, obj: Any, ref: Reference) -> None:
        self._references[obj] = ref

    def del_ref(self, obj: Any) -> None:
        del self._references[obj]

    def add_buf(self, obj: bytes) -> Buffer:
        buffer = Buffer(self._next_id(), obj)
        if self.binary:
            self._buffers.append(buffer)
        return buffer

    @property
    def references(self) -> List[Reference]:
        return list(self._references.values())

    @property
    def buffers(self) -> List[Buffer]:
        return list(self._buffers)

    _id: int = 0
    def _next_id(self) -> ID:
        self._id += 1
        return ID(str(self._id))

    def _encode(self, obj: Any) -> JSON:
        if isinstance(obj, Serializable):
            return obj.to_serializable(self)
        elif type(obj) in _serializers:
            return _serializers[type(obj)](self)
        elif obj is None:
            return None
        elif isinstance(obj, bool):
            return self._encode_bool(obj)
        elif isinstance(obj, str):
            return self._encode_str(obj)
        elif isinstance(obj, int):
            return self._encode_int(obj)
        elif isinstance(obj, float):
            return self._encode_float(obj)
        elif isinstance(obj, tuple):
            return self._encode_tuple(obj)
        elif isinstance(obj, list):
            return self._encode_list(obj)
        elif isinstance(obj, dict):
            return self._encode_dict(obj)
        elif isinstance(obj, bytes):
            return self._encode_bytes(obj)
        elif isinstance(obj, np.ndarray):
            return self._encode_ndarray(obj)
        elif is_dataclass(obj):
            return self._encode_dataclass(obj)
        else:
            return self._encode_other(obj)

    def _encode_bool(self, obj: bool) -> JSON:
        return obj

    def _encode_str(self, obj: str) -> JSON:
        return obj

    def _encode_int(self, obj: int) -> JSON:
        if -MAX_INT < obj <= MAX_INT:
            return obj
        else:
            log.warning("out of range integer may result in loss of precision")
            return self._encode_float(float(obj))

    def _encode_float(self, obj: float) -> JSON:
        if isnan(obj):
            return dict(type="number", value="nan")
        elif isinf(obj):
            return dict(type="number", value=f"{'-' if obj < 0 else '+'}inf")
        else:
            return obj

    def _encode_tuple(self, obj: Tuple[Any, ...]) -> JSON:
        return self._encode_list(list(obj))

    def _encode_list(self, obj: List[Any]) -> JSON:
        return [self._encode(item) for item in obj]

    def _encode_dict(self, obj: Dict[Any, Any]) -> JSON:
        return {self._encode(key): self._encode(val) for key, val in obj.items()}

    def _encode_dataclass(self, obj: Any) -> JSON:
        cls = type(obj)
        return dict(
            type=f"{cls.__module__}.{cls.__name__}",
            attributes=[ (key, self._encode(val)) for key, val in entries(obj) ],
        )

    def _encode_bytes(self, obj: bytes) -> JSON:
        buffer = self.add_buf(obj)
        return dict(
            type="bytes",
            data=buffer.ref if self.binary else buffer.to_base64(),
        )

    def _encode_ndarray(self, obj: npt.NDArray[Any]) -> JSON:
        array = transform_array(obj)

        if array_encoding_disabled(array):
            data = self._encode_list(array.tolist())
        else:
            data = self._encode_bytes(array.tobytes())

        return dict(
            type="ndarray",
            array=data,
            shape=array.shape,
            dtype=str(array.dtype.name),
            order=sys.byteorder,
        )

    def _encode_other(self, obj: Any) -> Any:
        pd = import_optional("pandas")
        if pd and isinstance(obj, (pd.Series, pd.Index)):
            return self._encode_ndarray(transform_series(obj))

        # date/time values that get serialized as milliseconds
        if is_datetime_type(obj):
            return convert_datetime_type(obj)

        if is_timedelta_type(obj):
            return convert_timedelta_type(obj)

        if isinstance(obj, dt.date):
            return obj.isoformat()

        # NumPy scalars
        if np.issubdtype(type(obj), np.floating):
            return self._encode_float(float(obj))
        if np.issubdtype(type(obj), np.integer):
            return self._encode_int(int(obj))
        if np.issubdtype(type(obj), np.bool_):
            return self._encode_bool(bool(obj))

        rd = import_optional("dateutil.relativedelta")
        if rd and isinstance(obj, rd.relativedelta):
            return dict(
                years=self.to_serializable(obj.years),
                months=self.to_serializable(obj.months),
                days=self.to_serializable(obj.days),
                hours=self.to_serializable(obj.hours),
                minutes=self.to_serializable(obj.minutes),
                seconds=self.to_serializable(obj.seconds),
                microseconds=self.to_serializable(obj.microseconds),
            )

        raise SerializationError(f"can't serialize {type(obj)}")

class Deserializer:
    """ """

    # TODO: refs, buffers

    def from_serializable(self, obj: JSON) -> Any:
        return self._decode(obj)

    def _decode(self, obj: JSON) -> Any:
        if isinstance(obj, dict):
            if "type" in obj:
                type = obj["type"]
                if type == "number":
                    value = obj["value"]
                    return float(value) if isinstance(value, str) else value
                elif type == "array":
                    entries = obj["entries"]
                    return [ self._decode(entry) for entry in entries ]
                elif type == "ndarray":
                    return decode_base64_dict(obj)
                elif type == "set":
                    entries = obj["entries"]
                    return set([ self._decode(entry) for entry in entries ])
                elif type == "map":
                    entries = obj["entries"]
                    return { self._decode(key): self._decode(val) for key, val in entries.items() }
                else:
                    raise ValueError(f"unsupported serialized type '{type}'")
            else:
                return { key: self._decode(val) for key, val in obj.items() }
        elif isinstance(obj, list):
            return [ self._decode(entry) for entry in obj ]
        else:
            return obj

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
