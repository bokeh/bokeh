#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''
Functions for helping with serialization and deserialization of
Bokeh objects.

Certain NumPy array dtypes can be serialized to a binary format for
performance and efficiency. The list of supported dtypes is:

{binary_array_types}

'''

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
import datetime as dt
import uuid
from functools import lru_cache
from threading import Lock
from typing import TYPE_CHECKING, Any

# External imports
import numpy as np

# Bokeh imports
from ..core.types import ID
from ..settings import settings
from .strings import format_docstring

if TYPE_CHECKING:
    import numpy.typing as npt
    import pandas as pd
    from typing_extensions import TypeGuard

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

@lru_cache(None)
def _compute_datetime_types() -> set[type]:
    import pandas as pd

    result = {dt.time, dt.datetime, np.datetime64}
    result.add(pd.Timestamp)
    result.add(pd.Timedelta)
    result.add(pd.Period)
    result.add(type(pd.NaT))
    return result

def __getattr__(name: str) -> Any:
    if name == "DATETIME_TYPES":
        return _compute_datetime_types()
    raise AttributeError

BINARY_ARRAY_TYPES = {
    np.dtype(np.bool_),
    np.dtype(np.uint8),
    np.dtype(np.int8),
    np.dtype(np.uint16),
    np.dtype(np.int16),
    np.dtype(np.uint32),
    np.dtype(np.int32),
    #np.dtype(np.uint64),
    #np.dtype(np.int64),
    np.dtype(np.float32),
    np.dtype(np.float64),
}

NP_EPOCH = np.datetime64(0, 'ms')
NP_MS_DELTA = np.timedelta64(1, 'ms')

DT_EPOCH = dt.datetime.fromtimestamp(0, tz=dt.timezone.utc)

__doc__ = format_docstring(__doc__, binary_array_types="\n".join(f"* ``np.{x}``" for x in BINARY_ARRAY_TYPES))

__all__ = (
    'array_encoding_disabled',
    'convert_date_to_datetime',
    'convert_datetime_array',
    'convert_datetime_type',
    'convert_timedelta_type',
    'is_datetime_type',
    'is_timedelta_type',
    'make_globally_unique_css_safe_id',
    'make_globally_unique_id',
    'make_id',
    'transform_array',
    'transform_series',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def is_datetime_type(obj: Any) -> TypeGuard[dt.time | dt.datetime | np.datetime64]:
    ''' Whether an object is any date, time, or datetime type recognized by
    Bokeh.

    Args:
        obj (object) : the object to test

    Returns:
        bool : True if ``obj`` is a datetime type

    '''
    _dt_tuple = tuple(_compute_datetime_types())

    return isinstance(obj, _dt_tuple)

def is_timedelta_type(obj: Any) -> TypeGuard[dt.timedelta | np.timedelta64]:
    ''' Whether an object is any timedelta type recognized by Bokeh.

    Args:
        obj (object) : the object to test

    Returns:
        bool : True if ``obj`` is a timedelta type

    '''
    return isinstance(obj, (dt.timedelta, np.timedelta64))

def convert_date_to_datetime(obj: dt.date) -> float:
    ''' Convert a date object to a datetime

    Args:
        obj (date) : the object to convert

    Returns:
        datetime

    '''
    return (dt.datetime(*obj.timetuple()[:6], tzinfo=dt.timezone.utc) - DT_EPOCH).total_seconds() * 1000

def convert_timedelta_type(obj: dt.timedelta | np.timedelta64) -> float:
    ''' Convert any recognized timedelta value to floating point absolute
    milliseconds.

    Args:
        obj (object) : the object to convert

    Returns:
        float : milliseconds

    '''
    if isinstance(obj, dt.timedelta):
        return obj.total_seconds() * 1000.
    elif isinstance(obj, np.timedelta64):
        return float(obj / NP_MS_DELTA)

    raise ValueError(f"Unknown timedelta object: {obj!r}")

# The Any here should be pd.NaT | pd.Period but mypy chokes on that for some reason
def convert_datetime_type(obj: Any | pd.Timestamp | pd.Timedelta | dt.datetime | dt.date | dt.time | np.datetime64) -> float:
    ''' Convert any recognized date, time, or datetime value to floating point
    milliseconds since epoch.

    Args:
        obj (object) : the object to convert

    Returns:
        float : milliseconds

    '''
    import pandas as pd

    # Pandas NaT
    if obj is pd.NaT:
        return np.nan

    # Pandas Period
    if isinstance(obj, pd.Period):
        return obj.to_timestamp().value / 10**6.0

    # Pandas Timestamp
    if isinstance(obj, pd.Timestamp):
        return obj.value / 10**6.0

    # Pandas Timedelta
    elif isinstance(obj, pd.Timedelta):
        return obj.value / 10**6.0

    # Datetime (datetime is a subclass of date)
    elif isinstance(obj, dt.datetime):
        diff = obj.replace(tzinfo=dt.timezone.utc) - DT_EPOCH
        return diff.total_seconds() * 1000

    # XXX (bev) ideally this would not be here "dates are not datetimes"
    # Date
    elif isinstance(obj, dt.date):
        return convert_date_to_datetime(obj)

    # NumPy datetime64
    elif isinstance(obj, np.datetime64):
        epoch_delta = obj - NP_EPOCH
        return float(epoch_delta / NP_MS_DELTA)

    # Time
    elif isinstance(obj, dt.time):
        return (obj.hour*3600 + obj.minute*60 + obj.second)*1000 + obj.microsecond/1000.0

    raise ValueError(f"unknown datetime object: {obj!r}")


def convert_datetime_array(array: npt.NDArray[Any]) -> npt.NDArray[np.floating[Any]]:
    ''' Convert NumPy datetime arrays to arrays to milliseconds since epoch.

    Args:
        array : (obj)
            A NumPy array of datetime to convert

            If the value passed in is not a NumPy array, it will be returned as-is.

    Returns:
        array

    '''
    def convert(array: npt.NDArray[Any]) -> npt.NDArray[Any]:
        return np.where(np.isnat(array), np.nan, array.astype("int64")/1000.0)

    # not quite correct, truncates to ms..
    if array.dtype.kind == "M":
        return convert(array.astype("datetime64[us]"))
    elif array.dtype.kind == "m":
        return convert(array.astype("timedelta64[us]"))
    # XXX (bev) special case dates, not great
    elif array.dtype.kind == "O" and len(array) > 0 and isinstance(array[0], dt.date):
        try:
            return convert(array.astype("datetime64[us]"))
        except Exception:
            pass

    return array

def make_id() -> ID:
    ''' Return a new unique ID for a Bokeh object.

    Normally this function will return simple monotonically increasing integer
    IDs (as strings) for identifying Bokeh objects within a Document. However,
    if it is desirable to have globally unique for every object, this behavior
    can be overridden by setting the environment variable ``BOKEH_SIMPLE_IDS=no``.

    Returns:
        str

    '''
    global _simple_id

    if settings.simple_ids():
        with _simple_id_lock:
            _simple_id += 1
            return ID(f"p{_simple_id}")
    else:
        return make_globally_unique_id()

def make_globally_unique_id() -> ID:
    ''' Return a globally unique UUID.

    Some situations, e.g. id'ing dynamically created Divs in HTML documents,
    always require globally unique IDs.

    Returns:
        str

    '''
    return ID(str(uuid.uuid4()))

def make_globally_unique_css_safe_id() -> ID:
    ''' Return a globally unique CSS-safe UUID.

    Some situations, e.g. id'ing dynamically created Divs in HTML documents,
    always require globally unique IDs. ID generated with this function can
    be used in APIs like ``document.querySelector("#id")``.

    Returns:
        str

    '''
    max_iter = 100

    for _i in range(0, max_iter):
        id = make_globally_unique_id()
        if id[0].isalpha():
            return id

    return ID(f"bk-{make_globally_unique_id()}")

def array_encoding_disabled(array: npt.NDArray[Any]) -> bool:
    ''' Determine whether an array may be binary encoded.

    The NumPy array dtypes that can be encoded are:

    {binary_array_types}

    Args:
        array (np.ndarray) : the array to check

    Returns:
        bool

    '''

    # disable binary encoding for non-supported dtypes
    return array.dtype not in BINARY_ARRAY_TYPES

array_encoding_disabled.__doc__ = format_docstring(
    array_encoding_disabled.__doc__,
    binary_array_types="\n    ".join(f"* ``np.{x}``" for x in BINARY_ARRAY_TYPES),
)

def transform_array(array: npt.NDArray[Any]) -> npt.NDArray[Any]:
    ''' Transform a ndarray into a serializable ndarray.

    Converts un-serializable dtypes and returns JSON serializable
    format

    Args:
        array (np.ndarray) : a NumPy array to be transformed

    Returns:
        ndarray

    '''
    array = convert_datetime_array(array)

    # XXX: as long as we can't support 64-bit integers, try to convert
    # to 32-bits. If not possible, let the serializer convert to a less
    # efficient representation and/or deal with any error messaging.
    def _cast_if_can(array: npt.NDArray[Any], dtype: type[Any]) -> npt.NDArray[Any]:
        info = np.iinfo(dtype)

        if np.any((array < info.min) | (info.max < array)):
            return array
        else:
            return array.astype(dtype, casting="unsafe")

    if array.dtype == np.dtype(np.int64):
        array = _cast_if_can(array, np.int32)
    elif array.dtype == np.dtype(np.uint64):
        array = _cast_if_can(array, np.uint32)

    if isinstance(array, np.ma.MaskedArray):
        array = array.filled(np.nan)  # type: ignore # filled is untyped
    if not array.flags["C_CONTIGUOUS"]:
        array = np.ascontiguousarray(array)

    return array

def transform_series(series: pd.Series[Any] | pd.Index[Any] | pd.api.extensions.ExtensionArray) -> npt.NDArray[Any]:
    ''' Transforms a Pandas series into serialized form

    Args:
        series (pd.Series) : the Pandas series to transform

    Returns:
        ndarray

    '''
    import pandas as pd

    # not checking for pd here, this function should only be called if it
    # is already known that series is a Pandas Series type
    if isinstance(series, pd.PeriodIndex):
        vals = series.to_timestamp().values
    else:
        vals = series.to_numpy()
    return vals

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_simple_id = 999
_simple_id_lock = Lock()

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
