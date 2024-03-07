#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Serialization and deserialization utilities. """

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
from types import SimpleNamespace
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    ClassVar,
    Generic,
    Literal,
    NoReturn,
    Sequence,
    TypedDict,
    TypeVar,
    Union,
    cast,
)

# External imports
import numpy as np

# Bokeh imports
from ..util.dataclasses import (
    Unspecified,
    dataclass,
    entries,
    is_dataclass,
)
from ..util.dependencies import uses_pandas
from ..util.serialization import (
    array_encoding_disabled,
    convert_datetime_type,
    convert_timedelta_type,
    is_datetime_type,
    is_timedelta_type,
    make_id,
    transform_array,
    transform_series,
)
from ..util.warnings import BokehUserWarning, warn
from .types import ID

if TYPE_CHECKING:
    import numpy.typing as npt
    from typing_extensions import NotRequired, TypeAlias

    from ..core.has_props import Setter
    from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Buffer",
    "DeserializationError",
    "Deserializer",
    "Serializable",
    "SerializationError",
    "Serializer",
)

_MAX_SAFE_INT = 2**53 - 1

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

AnyRep: TypeAlias = Any

class Ref(TypedDict):
    id: ID

class RefRep(TypedDict):
    type: Literal["ref"]
    id: ID

class SymbolRep(TypedDict):
    type: Literal["symbol"]
    name: str

class NumberRep(TypedDict):
    type: Literal["number"]
    value: Literal["nan", "-inf", "+inf"] | float

class ArrayRep(TypedDict):
    type: Literal["array"]
    entries: NotRequired[list[AnyRep]]

ArrayRepLike: TypeAlias = Union[ArrayRep, list[AnyRep]]

class SetRep(TypedDict):
    type: Literal["set"]
    entries: NotRequired[list[AnyRep]]

class MapRep(TypedDict):
    type: Literal["map"]
    entries: NotRequired[list[tuple[AnyRep, AnyRep]]]

class BytesRep(TypedDict):
    type: Literal["bytes"]
    data: Buffer | Ref | str

class SliceRep(TypedDict):
    type: Literal["slice"]
    start: int | None
    stop: int | None
    step: int | None

class ObjectRep(TypedDict):
    type: Literal["object"]
    name: str
    attributes: NotRequired[dict[str, AnyRep]]

class ObjectRefRep(TypedDict):
    type: Literal["object"]
    name: str
    id: ID
    attributes: NotRequired[dict[str, AnyRep]]

ModelRep = ObjectRefRep

ByteOrder: TypeAlias = Literal["little", "big"]

DataType: TypeAlias = Literal["uint8", "int8", "uint16", "int16", "uint32", "int32", "float32", "float64"] # "uint64", "int64"
NDDataType: TypeAlias = Union[Literal["bool"], DataType, Literal["object"]]

class TypedArrayRep(TypedDict):
    type: Literal["typed_array"]
    array: BytesRep
    order: ByteOrder
    dtype: DataType

class NDArrayRep(TypedDict):
    type: Literal["ndarray"]
    array: BytesRep | ArrayRepLike
    order: ByteOrder
    dtype: NDDataType
    shape: list[int]

@dataclass
class Buffer:
    id: ID
    data: bytes | memoryview

    @property
    def ref(self) -> Ref:
        return Ref(id=self.id)

    def to_bytes(self) -> bytes:
        return self.data.tobytes() if isinstance(self.data, memoryview) else self.data

    def to_base64(self) -> str:
        return base64.b64encode(self.data).decode("utf-8")

T = TypeVar("T")

@dataclass
class Serialized(Generic[T]):
    content: T
    buffers: list[Buffer] | None = None

Encoder: TypeAlias = Callable[[Any, "Serializer"], AnyRep]
Decoder: TypeAlias = Callable[[AnyRep, "Deserializer"], Any]

class SerializationError(ValueError):
    pass

class Serializable:
    """ A mixin for making a type serializable. """

    def to_serializable(self, serializer: Serializer) -> AnyRep:
        """ Converts this object to a serializable representation. """
        raise NotImplementedError()

ObjID = int

class Serializer:
    """ Convert built-in and custom types into serializable representations.
        Not all built-in types are supported (e.g., decimal.Decimal due to
        lacking support for fixed point arithmetic in JavaScript).
    """
    _encoders: ClassVar[dict[type[Any], Encoder]] = {}

    @classmethod
    def register(cls, type: type[Any], encoder: Encoder) -> None:
        assert type not in cls._encoders, f"'{type} is already registered"
        cls._encoders[type] = encoder

    _references: dict[ObjID, Ref]
    _deferred: bool
    _circular: dict[ObjID, Any]
    _buffers: list[Buffer]

    def __init__(self, *, references: set[Model] = set(), deferred: bool = True) -> None:
        self._references = {id(obj): obj.ref for obj in references}
        self._deferred = deferred
        self._circular = {}
        self._buffers = []

    def has_ref(self, obj: Any) -> bool:
        return id(obj) in self._references

    def add_ref(self, obj: Any, ref: Ref) -> None:
        assert id(obj) not in self._references
        self._references[id(obj)] = ref

    def get_ref(self, obj: Any) -> Ref | None:
        return self._references.get(id(obj))

    @property
    def buffers(self) -> list[Buffer]:
        return list(self._buffers)

    def serialize(self, obj: Any) -> Serialized[Any]:
        return Serialized(self.encode(obj), self.buffers)

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

    def encode_struct(self, **fields: Any) -> dict[str, AnyRep]:
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
        elif isinstance(obj, set):
            return self._encode_set(obj)
        elif isinstance(obj, dict):
            return self._encode_dict(obj)
        elif isinstance(obj, SimpleNamespace):
            return self._encode_struct(obj)
        elif isinstance(obj, bytes):
            return self._encode_bytes(obj)
        elif isinstance(obj, slice):
            return self._encode_slice(obj)
        elif isinstance(obj, TypedArray):
            return self._encode_typed_array(obj)
        elif isinstance(obj, np.ndarray):
            if obj.shape != ():
                return self._encode_ndarray(obj)
            else:
                return self._encode(obj.item())
        elif is_dataclass(obj):
            return self._encode_dataclass(obj)
        else:
            return self._encode_other(obj)

    def _encode_bool(self, obj: bool) -> AnyRep:
        return obj

    def _encode_str(self, obj: str) -> AnyRep:
        return obj

    def _encode_int(self, obj: int) -> AnyRep:
        if -_MAX_SAFE_INT < obj <= _MAX_SAFE_INT:
            return obj
        else:
            warn("out of range integer may result in loss of precision", BokehUserWarning)
            return self._encode_float(float(obj))

    def _encode_float(self, obj: float) -> NumberRep | float:
        if isnan(obj):
            return NumberRep(type="number", value="nan")
        elif isinf(obj):
            return NumberRep(type="number", value="-inf" if obj < 0 else "+inf")
        else:
            return obj

    def _encode_tuple(self, obj: tuple[Any, ...]) -> ArrayRepLike:
        return self._encode_list(list(obj))

    def _encode_list(self, obj: list[Any]) -> ArrayRepLike:
        return [self.encode(item) for item in obj]

    def _encode_set(self, obj: set[Any]) -> SetRep:
        if len(obj) == 0:
            return SetRep(type="set")
        else:
            return SetRep(
                type="set",
                entries=[self.encode(entry) for entry in obj],
            )

    def _encode_dict(self, obj: dict[Any, Any]) -> MapRep:
        if len(obj) == 0:
            result = MapRep(type="map")
        else:
            result = MapRep(
                type="map",
                entries=[(self.encode(key), self.encode(val)) for key, val in obj.items()],
            )

        return result

    def _encode_struct(self, obj: SimpleNamespace) -> MapRep:
        return self._encode_dict(obj.__dict__)

    def _encode_dataclass(self, obj: Any) -> ObjectRep:
        cls = type(obj)

        module = cls.__module__
        name = cls.__qualname__.replace("<locals>.", "")

        rep = ObjectRep(
            type="object",
            name=f"{module}.{name}",
        )

        attributes = list(entries(obj))
        if attributes:
            rep["attributes"] = {key: self.encode(val) for key, val in attributes}

        return rep

    def _encode_bytes(self, obj: bytes | memoryview) -> BytesRep:
        buffer = Buffer(make_id(), obj)

        data: Buffer | str
        if self._deferred:
            self._buffers.append(buffer)
            data = buffer
        else:
            data = buffer.to_base64()

        return BytesRep(type="bytes", data=data)

    def _encode_slice(self, obj: slice) -> SliceRep:
        return SliceRep(
            type="slice",
            start=self.encode(obj.start),
            stop=self.encode(obj.stop),
            step=self.encode(obj.step),
        )

    def _encode_typed_array(self, obj: TypedArray[Any]) -> TypedArrayRep:
        array = self._encode_bytes(memoryview(obj))

        typecode = obj.typecode
        itemsize = obj.itemsize

        def dtype() -> DataType:
            if typecode == "f":
                return "float32"
            elif typecode == "d":
                return "float64"
            elif typecode in {"B", "H", "I", "L", "Q"}:
                if obj.itemsize == 1:
                    return "uint8"
                elif obj.itemsize == 2:
                    return "uint16"
                elif obj.itemsize == 4:
                    return "uint32"
                #elif obj.itemsize == 8:
                #    return "uint64"
            elif typecode in {"b", "h", "i", "l", "q"}:
                if obj.itemsize == 1:
                    return "int8"
                elif obj.itemsize == 2:
                    return "int16"
                elif obj.itemsize == 4:
                    return "int32"
                #elif obj.itemsize == 8:
                #    return "int64"
            self.error(f"can't serialize array with items of type '{typecode}@{itemsize}'")

        return TypedArrayRep(
            type="typed_array",
            array=array,
            order=sys.byteorder,
            dtype=dtype(),
        )

    def _encode_ndarray(self, obj: npt.NDArray[Any]) -> NDArrayRep:
        array = transform_array(obj)

        data: ArrayRepLike | BytesRep
        dtype: NDDataType
        if array_encoding_disabled(array):
            data = self._encode_list(array.flatten().tolist())
            dtype = "object"
        else:
            data = self._encode_bytes(array.data)
            dtype = cast(NDDataType, array.dtype.name)

        return NDArrayRep(
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

        # avoid importing pandas here unless it is actually in use
        if uses_pandas(obj):
            import pandas as pd
            if isinstance(obj, (pd.Series, pd.Index, pd.api.extensions.ExtensionArray)):
                return self._encode_ndarray(transform_series(obj))
            elif obj is pd.NA:
                return None

        # handle array libraries that support conversion to a numpy array (e.g. polars, PyTorch)
        if hasattr(obj, "__array__") and isinstance(arr := obj.__array__(), np.ndarray):
            return self._encode_ndarray(arr)

        self.error(f"can't serialize {type(obj)}")

    def error(self, message: str) -> NoReturn:
        raise SerializationError(message)

class DeserializationError(ValueError):
    pass

class UnknownReferenceError(DeserializationError):

    def __init__(self, id: ID) -> None:
        super().__init__(f"can't resolve reference '{id}'")
        self.id = id

class Deserializer:
    """ Convert from serializable representations to built-in and custom types. """

    _decoders: ClassVar[dict[str, Decoder]] = {}

    @classmethod
    def register(cls, type: str, decoder: Decoder) -> None:
        assert type not in cls._decoders, f"'{type} is already registered"
        cls._decoders[type] = decoder

    _references: dict[ID, Model]
    _setter: Setter | None

    _decoding: bool
    _buffers: dict[ID, Buffer]

    def __init__(self, references: Sequence[Model] | None = None, *, setter: Setter | None = None):
        self._references = {obj.id: obj for obj in references or []}
        self._setter = setter
        self._decoding = False
        self._buffers = {}

    def has_ref(self, obj: Model) -> bool:
        return obj.id in self._references

    def deserialize(self, obj: Any | Serialized[Any]) -> Any:
        if isinstance(obj, Serialized):
            return self.decode(obj.content, obj.buffers)
        else:
            return self.decode(obj)

    def decode(self, obj: AnyRep, buffers: list[Buffer] | None = None) -> Any:
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
            if "type" in obj:
                type = obj["type"]
                if type in self._decoders:
                    return self._decoders[type](obj, self)
                elif type == "ref":
                    return self._decode_ref(cast(Ref, obj))
                elif type == "symbol":
                    return self._decode_symbol(cast(SymbolRep, obj))
                elif type == "number":
                    return self._decode_number(cast(NumberRep, obj))
                elif type == "array":
                    return self._decode_array(cast(ArrayRep, obj))
                elif type == "set":
                    return self._decode_set(cast(SetRep, obj))
                elif type == "map":
                    return self._decode_map(cast(MapRep, obj))
                elif type == "bytes":
                    return self._decode_bytes(cast(BytesRep, obj))
                elif type == "slice":
                    return self._decode_slice(cast(SliceRep, obj))
                elif type == "typed_array":
                    return self._decode_typed_array(cast(TypedArrayRep, obj))
                elif type == "ndarray":
                    return self._decode_ndarray(cast(NDArrayRep, obj))
                elif type == "object":
                    if "id" in obj:
                        return self._decode_object_ref(cast(ObjectRefRep, obj))
                    else:
                        return self._decode_object(cast(ObjectRep, obj))
                else:
                    self.error(f"unable to decode an object of type '{type}'")
            elif "id" in obj:
                return self._decode_ref(cast(Ref, obj))
            else:
                return {key: self._decode(val) for key, val in obj.items()}
        elif isinstance(obj, list):
            return [self._decode(entry) for entry in obj]
        else:
            return obj

    def _decode_ref(self, obj: Ref) -> Model:
        id = obj["id"]
        instance = self._references.get(id)
        if instance is not None:
            return instance
        else:
            self.error(UnknownReferenceError(id))

    def _decode_symbol(self, obj: SymbolRep) -> float:
        name = obj["name"]
        self.error(f"can't resolve named symbol '{name}'") # TODO: implement symbol resolution

    def _decode_number(self, obj: NumberRep) -> float:
        value = obj["value"]
        return float(value) if isinstance(value, str) else value

    def _decode_array(self, obj: ArrayRep) -> list[Any]:
        entries = obj.get("entries", [])
        return [ self._decode(entry) for entry in entries ]

    def _decode_set(self, obj: SetRep) -> set[Any]:
        entries = obj.get("entries", [])
        return { self._decode(entry) for entry in entries }

    def _decode_map(self, obj: MapRep) -> dict[Any, Any]:
        entries = obj.get("entries", [])
        return { self._decode(key): self._decode(val) for key, val in entries }

    def _decode_bytes(self, obj: BytesRep) -> bytes:
        data = obj["data"]

        if isinstance(data, str):
            return base64.b64decode(data)
        elif isinstance(data, Buffer):
            buffer = data # in case of decode(encode(obj))
        else:
            id = data["id"]

            if id in self._buffers:
                buffer = self._buffers[id]
            else:
                self.error(f"can't resolve buffer '{id}'")

        return buffer.data

    def _decode_slice(self, obj: SliceRep) -> slice:
        start = self._decode(obj["start"])
        stop = self._decode(obj["stop"])
        step = self._decode(obj["step"])
        return slice(start, stop, step)

    def _decode_typed_array(self, obj: TypedArrayRep) -> TypedArray[Any]:
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

        typed_array: TypedArray[Any] = TypedArray(typecode, data)
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
            ndarray = np.copy(np.frombuffer(decoded, dtype=dtype))

            if order != sys.byteorder:
                ndarray.byteswap(inplace=True)
        else:
            ndarray = np.array(decoded, dtype=dtype)

        if len(shape) > 1:
            ndarray = ndarray.reshape(shape)

        return ndarray

    def _decode_object(self, obj: ObjectRep) -> object:
        raise NotImplementedError()

    def _decode_object_ref(self, obj: ObjectRefRep) -> Model:
        id = obj["id"]
        instance = self._references.get(id)
        if instance is not None:
            warn(f"reference already known '{id}'", BokehUserWarning)
            return instance

        name = obj["name"]
        attributes = obj.get("attributes")

        cls = self._resolve_type(name)
        instance = cls.__new__(cls, id=id)

        if instance is None:
            self.error(f"can't instantiate {name}(id={id})")

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

    def _resolve_type(self, type: str) -> type[Model]:
        from ..model import Model
        cls = Model.model_class_reverse_map.get(type)
        if cls is not None:
            if issubclass(cls, Model):
                return cls
            else:
                self.error(f"object of type '{type}' is not a subclass of 'Model'")
        else:
            if type == "Figure":
                from ..plotting import figure
                return figure # XXX: helps with push_session(); this needs a better resolution scheme
            else:
                self.error(f"can't resolve type '{type}'")

    def error(self, error: str | DeserializationError) -> NoReturn:
        if isinstance(error, str):
            raise DeserializationError(error)
        else:
            raise error

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
