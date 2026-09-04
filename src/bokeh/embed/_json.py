#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Strict JSON helpers shared by embedding artifacts and renderer identities."""

from __future__ import annotations

# Standard library imports
import json
import math
from collections.abc import Mapping, Sequence
from decimal import Decimal
from typing import Any

_MAX_SAFE_INTEGER = 2**53 - 1


def canonical_json(value: Any) -> str:
    """Return deterministic JSON matching JavaScript's finite number spelling."""
    return _encode(value)


def json_copy(value: Any) -> Any:
    """Validate and detach one JSON-compatible value."""
    try:
        canonical_json(value)
    except (TypeError, ValueError, UnicodeError) as error:
        raise ValueError(f"embedding values must be JSON-compatible: {error}") from error
    return _copy(value)


def _copy(value: Any) -> Any:
    if value is None or isinstance(value, (bool, str)):
        return value
    if isinstance(value, int):
        return int(value)
    if isinstance(value, float):
        return float(value)
    if isinstance(value, Mapping):
        return {key: _copy(child) for key, child in value.items()}
    if isinstance(value, Sequence):
        return [_copy(child) for child in value]
    raise AssertionError("canonical JSON validation accepted an unsupported value")


def _encode(value: Any) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, str):
        return _encode_string(value)
    if isinstance(value, int):
        if abs(value) > _MAX_SAFE_INTEGER:
            raise ValueError(f"integer {value} exceeds JavaScript's safe integer range")
        return str(value)
    if isinstance(value, float):
        return _encode_float(value)
    if isinstance(value, Mapping):
        if any(not isinstance(key, str) for key in value):
            raise TypeError("JSON object keys must be strings")
        keys = sorted(value, key=_utf16_sort_key)
        return "{" + ",".join(f"{_encode(key)}:{_encode(value[key])}" for key in keys) + "}"
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return "[" + ",".join(_encode(item) for item in value) + "]"
    raise TypeError(f"object of type {type(value).__name__} is not JSON serializable")


def _encode_float(value: float) -> str:
    if not math.isfinite(value):
        raise ValueError("non-finite numbers are not valid embedding JSON")
    if value == 0:
        return "0"
    if value.is_integer() and abs(value) <= _MAX_SAFE_INTEGER:
        return str(int(value))

    absolute = abs(value)
    text = repr(float(value)).lower()
    if 1e-6 <= absolute < 1e21:
        return format(Decimal(text), "f")

    mantissa, exponent = text.split("e") if "e" in text else (text, "0")
    mantissa = mantissa.rstrip("0").rstrip(".")
    exponent_value = int(exponent)
    sign = "+" if exponent_value >= 0 else ""
    return f"{mantissa}e{sign}{exponent_value}"


def _utf16_sort_key(value: str) -> bytes:
    return value.encode("utf-16-be", errors="surrogatepass")


def _encode_string(value: str) -> str:
    encoded = json.dumps(value, ensure_ascii=False)
    return "".join(
        f"\\u{ord(char):04x}" if 0xD800 <= ord(char) <= 0xDFFF else char
        for char in encoded
    )


__all__ = ("canonical_json", "json_copy")
