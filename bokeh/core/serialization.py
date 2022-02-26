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
from array import array as TypedArray
from math import isinf, isnan
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    ClassVar,
    Dict,
    List,
    Literal,
    NoReturn,
    Sequence,
    Set,
    Tuple,
    Type,
    TypedDict,
)

# External imports
import numpy as np
from typing_extensions import TypeAlias

if TYPE_CHECKING:
    import numpy.typing as npt

# Bokeh imports
from ..util.dataclasses import (
    Unspecified,
    dataclass,
    entries,
    is_dataclass,
)
from ..util.dependencies import import_optional
from ..util.serialization import (
    array_encoding_disabled,
    convert_datetime_type,
    convert_timedelta_type,
    is_datetime_type,
    is_timedelta_type,
    transform_array,
    transform_series,
)
from .types import ID

if TYPE_CHECKING:
    from ..core.has_props import Setter
    from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "DeserializationError",
    "Deserializer",
    "SerializationError",
    "Serializer",
)

MAX_INT = 2**53 - 1

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

AnyRep: TypeAlias = Any

class Ref(TypedDict):
    id: ID

class _TypeRep(TypedDict):
    type: str
class TypeRep(_TypeRep, total=False):
    attributes: Dict[str, Any]

class _TypeRefRep(TypedDict):
    type: str
    id: ID
class TypeRefRep(_TypeRefRep, total=False):
    attributes: Dict[str, Any]

ModelRep = TypeRefRep

class ArrayRep(TypedDict):
    type: Literal["array"]
    entries: List[Any]

class BytesRep(TypedDict):
    type: Literal["bytes"]
    data: Ref | str

ByteOrder = Literal["little", "big"]

class SliceRep(TypedDict):
    start: int | None
    stop: int | None
    step: int | None

DType: TypeAlias = Literal["uint8", "int8", "uint16", "int16", "uint32", "int32", "float32", "float64"]

class TypedArrayRep(TypedDict):
    type: Literal["typed_array"]
    array: BytesRep
    order: ByteOrder
    dtype: DType

class NDArrayRep(TypedDict):
    type: Literal["ndarray"]
    array: BytesRep | ArrayRep
    order: ByteOrder
    dtype: DType | Literal["object"]
    shape: List[int]

@dataclass
class Buffer:
    id: ID
    data: bytes

    @property
    def ref(self) -> Ref:
        return Ref(id=self.id)

    def to_base64(self) -> str:
        return base64.b64encode(self.data).decode("utf-8")

Encoder: TypeAlias = Callable[[Any, "Serializer"], AnyRep]
Decoder: TypeAlias = Callable[[AnyRep, "Deserializer"], Any]

class SerializationError(ValueError):
    """ """

class Serializable:
    """ """

    def to_serializable(self, serializer: Serializer) -> AnyRep:
        """ """
        raise NotImplementedError()

ObjID = int

class Serializer:
    """ """

    _encoders: ClassVar[Dict[Type[Any], Encoder]] = {}

    @classmethod
    def register(cls, type: Type[Any], encoder: Encoder) -> None:
        assert type not in cls._encoders, f"'{type} is already registered"
        cls._encoders[type] = encoder

    _id: int
    _circular: Dict[ObjID, Any]
    _references: Dict[ObjID, Ref]
    _buffers: List[Buffer]

    def __init__(self, *, references: Set[Model] = set(), binary: bool = True) -> None:
        self._id = 0
        self._circular = {}
        self._references = {id(obj): obj.ref for obj in references}
        self._buffers = []
        self.binary = binary

    def has_ref(self, obj: Any) -> bool:
        return id(obj) in self._references

    def add_ref(self, obj: Any, ref: Ref) -> None:
        assert id(obj) not in self._references
        self._references[id(obj)] = ref

    def get_ref(self, obj: Any) -> Ref | None:
        return self._references.get(id(obj))

    def add_buf(self, obj: bytes) -> Buffer:
        buffer = Buffer(self._next_id(), obj)
        if self.binary:
            self._buffers.append(buffer)
        return buffer

    @property
    def buffers(self) -> List[Buffer]:
        return list(self._buffers)

    def _next_id(self) -> ID:
        self._id += 1
        return ID(str(self._id))

    def encode(self, obj: Any) -> AnyRep:
        ref = self.get_ref(obj)
        if ref is not None:
            return ref

        ident = id(obj)
        if ident in self._circular:
            self.error("circular reference")

        self._circular[ident] = obj
        try:
            return self._encode(obj)
        finally:
            del self._circular[ident]

    def encode_struct(self, **fields: Any) -> Dict[str, AnyRep]:
        return {key: self.encode(val) for key, val in fields.items() if val is not Unspecified}

    def _encode(self, obj: Any) -> AnyRep:
        if isinstance(obj, Serializable):
            return obj.to_serializable(self)
        elif (encoder := self._encoders.get(type(obj))) is not None:
            return encoder(obj, self)
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
        elif isinstance(obj, slice):
            return self._encode_slice(obj)
        elif isinstance(obj, TypedArray):
            return self._encode_array(obj)
        elif isinstance(obj, np.ndarray):
            return self._encode_ndarray(obj)
        elif is_dataclass(obj):
            return self._encode_dataclass(obj)
        else:
            return self._encode_other(obj)

    def _encode_bool(self, obj: bool) -> AnyRep:
        return obj

    def _encode_str(self, obj: str) -> AnyRep:
        return obj

    def _encode_int(self, obj: int) -> AnyRep:
        if -MAX_INT < obj <= MAX_INT:
            return obj
        else:
            log.warning("out of range integer may result in loss of precision")
            return self._encode_float(float(obj))

    def _encode_float(self, obj: float) -> AnyRep:
        if isnan(obj):
            return dict(type="number", value="nan")
        elif isinf(obj):
            return dict(type="number", value=f"{'-' if obj < 0 else '+'}inf")
        else:
            return obj

    def _encode_tuple(self, obj: Tuple[Any, ...]) -> AnyRep:
        return self._encode_list(list(obj))

    def _encode_list(self, obj: List[Any]) -> AnyRep:
        return [self.encode(item) for item in obj]

    def _encode_dict(self, obj: Dict[Any, Any]) -> AnyRep:
        return dict(
            type="map",
            entries=[[self.encode(key), self.encode(val)] for key, val in obj.items()],
        )

    def _encode_dataclass(self, obj: Any) -> AnyRep:
        cls = type(obj)
        return dict(
            type=f"{cls.__module__}.{cls.__name__}",
            attributes={key: self.encode(val) for key, val in entries(obj)},
        )

    def _encode_bytes(self, obj: bytes) -> AnyRep:
        buffer = self.add_buf(obj)
        return dict(
            type="bytes",
            data=buffer.ref if self.binary else buffer.to_base64(),
        )

    def _encode_slice(self, obj: slice) -> AnyRep:
        return self.encode_struct(
            type="slice",
            start=obj.start,
            stop=obj.stop,
            step=obj.step,
        )

    def _encode_array(self, obj: TypedArray[int | float]) -> AnyRep:
        array = self._encode_bytes(obj.tobytes())

        typecode = obj.typecode
        bitsize = obj.itemsize*8

        if typecode in {"f", "d"}:
            dtype = f"float{bitsize}"
        elif typecode in {"B", "H", "I", "L"}: #, "Q"}:
            dtype = f"uint{bitsize}"
        elif typecode in {"b", "h", "i", "l"}: #, "q"}:
            dtype = f"int{bitsize}"
        else:
            self.error(f"can't serialize array with items of type '{typecode}'")

        return dict(
            type="typed_array",
            array=array,
            order=sys.byteorder,
            dtype=dtype,
        )

    def _encode_ndarray(self, obj: npt.NDArray[Any]) -> AnyRep:
        array = transform_array(obj)

        if array_encoding_disabled(array):
            data = self._encode_list(array.flatten().tolist())
            dtype = "object"
        else:
            # TODO: investigate if this copy is really necessary
            data = self._encode_bytes(array.tobytes())
            dtype = str(array.dtype.name)

        return dict(
            type="ndarray",
            array=data,
            shape=list(array.shape),
            dtype=dtype,
            order=sys.byteorder,
        )

    def _encode_other(self, obj: Any) -> AnyRep:
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

        pd = import_optional("pandas")
        if pd and isinstance(obj, (pd.Series, pd.Index)):
            return self._encode_ndarray(transform_series(obj))

        rd = import_optional("dateutil.relativedelta")
        if rd and isinstance(obj, rd.relativedelta):
            return dict(
                years=self.encode(obj.years),
                months=self.encode(obj.months),
                days=self.encode(obj.days),
                hours=self.encode(obj.hours),
                minutes=self.encode(obj.minutes),
                seconds=self.encode(obj.seconds),
                microseconds=self.encode(obj.microseconds),
            )

        self.error(f"can't serialize {type(obj)}")

    def error(self, message: str) -> NoReturn:
        raise SerializationError(message)

class DeserializationError(ValueError):
    pass

class Deserializer:
    """ """

    _decoders: ClassVar[Dict[str, Decoder]] = {}

    @classmethod
    def register(cls, type: str, decoder: Decoder) -> None:
        assert type not in cls._decoders, f"'{type} is already registered"
        cls._decoders[type] = decoder

    _references: Dict[ID, Model]
    _setter: Setter | None

    _decoding: bool
    _buffers: Dict[ID, Buffer]

    def __init__(self, references: Sequence[Model] | None = None, setter: Setter | None = None):
        self._references = {obj.id: obj for obj in references or []}
        self._setter = setter
        self._decoding = False
        self._buffers = {}

    def decode(self, obj: AnyRep, buffers: List[Buffer] | None = None) -> Any:
        if buffers is not None:
            for buffer in buffers:
                self._buffers[buffer.id] = buffer

        if self._decoding:
            return self._decode(obj)

        self._decoding = True

        try:
            return self._decode(obj)
        finally:
            self._buffers.clear()
            self._decoding = False

    def _decode(self, obj: AnyRep) -> Any:
        if isinstance(obj, dict):
            if "id" in obj:
                if "type" not in obj:
                    return self._decode_ref(obj)
                else:
                    return self._decode_type_ref(obj)
            elif "type" in obj:
                type = obj["type"]
                if type == "number":
                    value = obj["value"]
                    return float(value) if isinstance(value, str) else value
                elif type == "array":
                    entries = obj["entries"]
                    return [ self._decode(entry) for entry in entries ]
                elif type == "set":
                    entries = obj["entries"]
                    return set([ self._decode(entry) for entry in entries ])
                elif type == "map":
                    entries = obj["entries"]
                    return { self._decode(key): self._decode(val) for key, val in entries }
                elif type == "bytes":
                    return self._decode_bytes(obj)
                elif type == "slice":
                    return self._decode_slice(obj)
                elif type == "typed_array":
                    return self._decode_typed_array(obj)
                elif type == "ndarray":
                    return self._decode_ndarray(obj)
                elif type in self._decoders:
                    return self._decoders[type](obj, self)
                else:
                    self.error(f"unsupported serialized type '{type}'")
            else:
                return { key: self._decode(val) for key, val in obj.items() }
        elif isinstance(obj, list):
            return [ self._decode(entry) for entry in obj ]
        else:
            return obj

    def _decode_ref(self, obj: Ref) -> Model:
        id = obj["id"]
        instance = self._references.get(id)
        if instance is not None:
            return instance
        else:
            self.error(f"can't resolve reference '{id}'")

    def _decode_type_ref(self, obj: ModelRep) -> Model:
        id = obj["id"]
        instance = self._references.get(id)
        if instance is not None:
            self.error(f"reference already known '{id}'")

        type = obj["type"]
        attributes = obj.get("attributes")

        from ..model import Model
        cls = Model.model_class_reverse_map.get(type)
        if cls is None:
            if type == "Figure":
                from ..plotting import figure
                cls = figure # XXX: helps with push_session(); this needs a better resolution scheme
            else:
                self.error(f"can't resolve type '{type}'")

        instance = cls.__new__(cls, id=id)
        if instance is None:
            self.error(f"can't instantiate {type}(id={id})")

        self._references[instance.id] = instance

        # We want to avoid any Model specific initialization that happens with
        # Slider(...) when reconstituting from JSON, but we do need to perform
        # general HasProps machinery that sets properties, so call it explicitly
        if not instance._initialized:
            from .has_props import HasProps
            HasProps.__init__(instance)

        if attributes is not None:
            decoded_attributes = {key: self._decode(val) for key, val in attributes.items()}
            for key, val in decoded_attributes.items():
                instance.set_from_json(key, val, setter=self._setter)

        return instance

    def _decode_bytes(self, obj: BytesRep) -> bytes:
        data = obj["data"]

        if isinstance(data, str):
            return base64.b64decode(data)
        else:
            id = data["id"]

            buffer = self._buffers.get(id)
            if buffer is not None:
                return buffer.data
            else:
                self.error(f"can't resolve buffer '{id}'")

    def _decode_slice(self, obj: SliceRep) -> slice:
        start = self._decode(obj["start"])
        stop = self._decode(obj["stop"])
        step = self._decode(obj["step"])
        return slice(start, stop, step)

    def _decode_typed_array(self, obj: TypedArrayRep) -> TypedArray[int | float]:
        array = obj["array"]
        order = obj["order"]
        dtype = obj["dtype"]

        data = self._decode(array)

        dtype_to_typecode = dict(
            uint8="B",
            int8="b",
            uint16="H",
            int16="h",
            uint32="I",
            int32="i",
            #uint64="Q",
            #int64="q",
            float32="f",
            float64="d",
        )

        typecode = dtype_to_typecode.get(dtype)
        if typecode is None:
            self.error(f"unsupported dtype '{dtype}'")

        typed_array = TypedArray(typecode, data)
        if order != sys.byteorder:
            typed_array.byteswap()

        return typed_array

    def _decode_ndarray(self, obj: NDArrayRep) -> npt.NDArray[Any]:
        array = obj["array"]
        order = obj["order"]
        dtype = obj["dtype"]
        shape = obj["shape"]

        decoded = self._decode(array)

        ndarray: npt.NDArray[Any]
        if isinstance(decoded, bytes):
            ndarray = np.copy(np.frombuffer(decoded, dtype=dtype))  # type: ignore # from and frombuffer are untyped

            if order != sys.byteorder:
                ndarray.byteswap(inplace=True)
        else:
            ndarray = np.array(decoded, dtype=dtype)

        if len(shape) > 1:
            ndarray = ndarray.reshape(shape)

        return ndarray

    def error(self, message: str) -> NoReturn:
        raise DeserializationError(message)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
