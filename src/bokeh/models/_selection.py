#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
"""Private selection transport. Public values remain sorted, unique Python lists.

Private wire format v1. Position range: nonnegative signed int32. Bitmap bits
are least-significant-bit first, relative to the smallest selected position.
All multiline rows share one payload; int32 row starts are 4-byte aligned.
"""

from __future__ import annotations

# Standard library imports
import sys
from array import array
from typing import TYPE_CHECKING, Any

# External imports
import numpy as np

# Bokeh imports
from ..core.property.wrappers import PropertyValueList
from ..core.serialization import Deserializer, Serializer

if TYPE_CHECKING:
    from collections.abc import Iterable


MAX_INDEX = 2**31 - 1
MAX_COUNT = MAX_INDEX + 1
SAVING_MARGIN = 64  # Avoid tiny bitmap wins that disappear in metadata overhead.


class _Indices(PropertyValueList[int]):
    # Only normalized input and validated wire payloads are marked canonical.
    # Invalidate before instrumented mutations, including operations that fail
    # after partially changing the list. No packed buffer is retained.
    _canonical: bool = False

    def _saved_copy(self) -> list[int]:
        self._canonical = False
        return super()._saved_copy()


def _canonical(values: Iterable[int]) -> _Indices:
    result = _Indices(values)
    result._canonical = True
    return result


def _from_array(array: np.ndarray[Any, Any], result: _Indices | None = None) -> _Indices:
    if result is None:
        result = _Indices()
    else:
        result._canonical = False
        list.clear(result)
    # Bound temporary Python lists and avoid a second full-size pointer array.
    for start in range(0, len(array), 65536):
        list.extend(result, array[start:start + 65536].tolist())
    result._canonical = True
    return result


def _validate_array(values: Any) -> np.ndarray[Any, Any]:
    array = np.asarray(values)
    if array.ndim != 1 or (array.size and array.dtype.kind not in "iu"):
        raise ValueError("selection positions must be one-dimensional integers")
    if not isinstance(values, np.ndarray):
        types = set(map(type, values))
        if bool in types or np.bool_ in types:
            raise ValueError("boolean selection positions are not supported")
    if array.size and (array.min() < 0 or array.max() > MAX_INDEX):
        raise ValueError("selection position outside nonnegative int32 range")
    return array


def validate(values: Any) -> None:
    if not isinstance(values, _Indices) or not values._canonical:
        _validate_array(values)


def normalize(values: Any) -> list[int]:
    if isinstance(values, _Indices) and values._canonical:
        return values
    array = _validate_array(values)
    if not array.size or np.all(array[1:] > array[:-1]):
        if isinstance(values, _Indices):
            values._canonical = True
            return values
        return _canonical(values) if isinstance(values, list) else _from_array(array)
    # Preserve held references and registered owners without recursively
    # invoking the instrumented mutation methods during normalization.
    return _from_array(np.unique(array), values if isinstance(values, _Indices) else None)


def pack(values: list[int], adaptive: bool = True) -> tuple[dict[str, Any], bytes]:
    n = len(values)
    origin = int(values[0]) if n else 0
    span = int(values[-1]) - origin + 1 if n else 0
    nbytes = (span + 7) // 8
    if adaptive and n and nbytes + SAVING_MARGIN < n * 4:
        if n == span:
            bits = bytearray(b"\xff") * nbytes
            if span % 8:
                bits[-1] &= (1 << (span % 8)) - 1
            data = bytes(bits)
        else:
            bits_array = np.zeros(nbytes, dtype=np.uint8)
            # Pack into bytes directly with bounded scratch space. Repeated byte
            # destinations need ufunc.at so no selected bits are overwritten.
            for start in range(0, n, 65536):
                offsets = np.fromiter(values[start:start + 65536], dtype=np.int32)
                offsets -= origin
                np.bitwise_or.at(bits_array, offsets >> 3, (1 << (offsets & 7)).astype(np.uint8))
            data = bits_array.tobytes()
        return dict(mode="bitmap", count=n, origin=origin, span=span), data
    packed = array("i", values)
    if packed.itemsize != 4:
        data = np.fromiter(values, dtype="<i4", count=n).tobytes()
    else:
        if sys.byteorder != "little":
            packed.byteswap()
        data = packed.tobytes()
    return dict(mode="int32", count=n), data


def _integer(value: Any, name: str, maximum: int = MAX_INDEX) -> int:
    if type(value) is not int or not 0 <= value <= maximum:
        raise ValueError(f"invalid {name}")
    return value


def unpack(meta: dict[str, Any], data: bytes | memoryview[int]) -> list[int]:
    n = _integer(meta.get("count"), "count", MAX_COUNT)
    mode = meta.get("mode")
    if mode == "int32":
        if len(data) != n * 4:
            raise ValueError("int32 length/count mismatch")
        a = np.frombuffer(data, dtype="<i4")
        if a.size and (a[0] < 0 or not np.all(a[1:] > a[:-1])):
            raise ValueError("int32 positions must be nonnegative, sorted, unique")
        return _from_array(a)
    if mode != "bitmap":
        raise ValueError("unsupported selection encoding")
    origin = _integer(meta.get("origin"), "origin")
    span = _integer(meta.get("span"), "span", MAX_INDEX + 1)
    if span == 0 or n == 0 or n > span or origin + span - 1 > MAX_INDEX:
        raise ValueError("invalid bitmap bounds")
    if len(data) != (span + 7) // 8:
        raise ValueError("bitmap length mismatch")
    raw = np.frombuffer(data, dtype=np.uint8)
    if span % 8 and int(raw[-1]) >> (span % 8):
        raise ValueError("nonzero padding bits")
    if n == span:
        expected_last = (1 << (span % 8)) - 1 if span % 8 else 255
        if not np.all(raw[:-1] == 255) or raw[-1] != expected_last:
            raise ValueError("bitmap cardinality mismatch")
        return _canonical(range(origin, origin + span))
    result = _Indices()
    for start in range(0, len(raw), 8192):
        bits = np.unpackbits(raw[start:start + 8192], bitorder="little")
        positions = np.flatnonzero(bits) + start*8 + origin
        if len(result) + len(positions) > n:
            raise ValueError("bitmap cardinality mismatch")
        list.extend(result, positions.tolist())
    if len(result) != n:
        raise ValueError("bitmap cardinality mismatch")
    result._canonical = True
    return result


def encode(value: Any, serializer: Serializer, multiline: bool = False, adaptive: bool = True) -> Any:
    if multiline:
        value = {key: normalize(values) for key, values in sorted(value.items())}
    else:
        value = normalize(value)
    if not serializer._deferred:
        return serializer.encode(value)
    if not multiline:
        meta, data = pack(value, adaptive)
        return dict(type="selection_indices_v1", **meta, data=serializer.encode(data))
    rows: list[Any] = []
    chunks: list[bytes] = []
    offset = 0
    for key, values in value.items():
        _integer(key, "multiline key")
        meta, data = pack(values, adaptive)
        padding = -offset % 4
        chunks.append(bytes(padding))
        offset += padding
        rows.append([key, dict(**meta, offset=offset, length=len(data))])
        chunks.append(data)
        offset += len(data)
    return dict(type="selection_map_v1", rows=rows, data=serializer.encode(b"".join(chunks)))


def decode(rep: dict[str, Any], deserializer: Deserializer) -> list[int] | dict[int, list[int]]:
    data = memoryview(deserializer.decode(rep["data"]))
    if rep["type"] == "selection_indices_v1":
        return unpack(rep, data)
    if rep["type"] != "selection_map_v1":
        raise ValueError("unsupported selection tag")
    result: dict[int, list[int]] = {}
    previous_key, end = -1, 0
    if not isinstance(rep.get("rows"), list):
        raise ValueError("invalid multiline rows")
    for row in rep["rows"]:
        if not isinstance(row, list) or len(row) != 2 or not isinstance(row[1], dict):
            raise ValueError("invalid multiline row")
        key, meta = row
        _integer(key, "multiline key")
        offset = _integer(meta.get("offset"), "offset", len(data))
        length = _integer(meta.get("length"), "length", len(data))
        if key <= previous_key or offset < end or offset % 4 or offset + length > len(data):
            raise ValueError("invalid multiline ordering or bounds")
        if offset != (end + 3) // 4 * 4 or any(data[end:offset]):
            raise ValueError("invalid multiline padding")
        result[key] = unpack(meta, data[offset : offset + length])
        previous_key, end = key, offset + length
    if end != len(data):
        raise ValueError("unreferenced trailing data")
    return result


for tag in ("selection_indices_v1", "selection_map_v1"):
    Deserializer.register(tag, decode)
