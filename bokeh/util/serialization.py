#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import base64
import datetime as dt
import sys
import uuid
from math import isinf, isnan
from threading import Lock

# External imports
import numpy as np

# Bokeh imports
from ..settings import settings
from .dependencies import import_optional
from .string import format_docstring

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

pd = import_optional('pandas')

BINARY_ARRAY_TYPES = set([
    np.dtype(np.float32),
    np.dtype(np.float64),
    np.dtype(np.uint8),
    np.dtype(np.int8),
    np.dtype(np.uint16),
    np.dtype(np.int16),
    np.dtype(np.uint32),
    np.dtype(np.int32),
])

DATETIME_TYPES = set([
    dt.time,
    dt.datetime,
    np.datetime64,
])

if pd:
    try:
        _pd_timestamp = pd.Timestamp
    except AttributeError:
        _pd_timestamp = pd.tslib.Timestamp
    DATETIME_TYPES.add(_pd_timestamp)
    DATETIME_TYPES.add(pd.Timedelta)
    DATETIME_TYPES.add(pd.Period)
    DATETIME_TYPES.add(type(pd.NaT))

NP_EPOCH = np.datetime64(0, 'ms')
NP_MS_DELTA = np.timedelta64(1, 'ms')

DT_EPOCH = dt.datetime.utcfromtimestamp(0)

__doc__ = format_docstring(__doc__, binary_array_types="\n".join("* ``np." + str(x) + "``" for x in BINARY_ARRAY_TYPES))

__all__ = (
    'array_encoding_disabled',
    'convert_date_to_datetime',
    'convert_datetime_array',
    'convert_datetime_type',
    'convert_timedelta_type',
    'decode_base64_dict',
    'encode_binary_dict',
    'encode_base64_dict',
    'is_datetime_type',
    'is_timedelta_type',
    'make_globally_unique_id',
    'make_id',
    'serialize_array',
    'transform_array',
    'transform_array_to_list',
    'transform_column_source_data',
    'traverse_data',
    'transform_series',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def is_datetime_type(obj):
    ''' Whether an object is any date, time, or datetime type recognized by
    Bokeh.

    Arg:
        obj (object) : the object to test

    Returns:
        bool : True if ``obj`` is a datetime type

    '''
    return isinstance(obj, _dt_tuple)

def is_timedelta_type(obj):
    ''' Whether an object is any timedelta type recognized by Bokeh.

    Arg:
        obj (object) : the object to test

    Returns:
        bool : True if ``obj`` is a timedelta type

    '''
    return isinstance(obj, (dt.timedelta, np.timedelta64))

def convert_date_to_datetime(obj):
    ''' Convert a date object to a datetime

    Args:
        obj (date) : the object to convert

    Returns:
        datetime

    '''
    return (dt.datetime(*obj.timetuple()[:6]) - DT_EPOCH).total_seconds() * 1000

def convert_timedelta_type(obj):
    ''' Convert any recognized timedelta value to floating point absolute
    milliseconds.

    Arg:
        obj (object) : the object to convert

    Returns:
        float : milliseconds

    '''
    if isinstance(obj, dt.timedelta):
        return obj.total_seconds() * 1000.
    elif isinstance(obj, np.timedelta64):
        return (obj / NP_MS_DELTA)

def convert_datetime_type(obj):
    ''' Convert any recognized date, time, or datetime value to floating point
    milliseconds since epoch.

    Arg:
        obj (object) : the object to convert

    Returns:
        float : milliseconds

    '''
    # Pandas NaT
    if pd and obj is pd.NaT:
        return np.nan

    # Pandas Period
    if pd and isinstance(obj, pd.Period):
        return obj.to_timestamp().value / 10**6.0

    # Pandas Timestamp
    if pd and isinstance(obj, _pd_timestamp): return obj.value / 10**6.0

    # Pandas Timedelta
    elif pd and isinstance(obj, pd.Timedelta): return obj.value / 10**6.0

    # Datetime (datetime is a subclass of date)
    elif isinstance(obj, dt.datetime):
        diff = obj.replace(tzinfo=None) - DT_EPOCH
        return diff.total_seconds() * 1000

    # XXX (bev) ideally this would not be here "dates are not datetimes"
    # Date
    elif isinstance(obj, dt.date):
        return convert_date_to_datetime(obj)

    # NumPy datetime64
    elif isinstance(obj, np.datetime64):
        epoch_delta = obj - NP_EPOCH
        return (epoch_delta / NP_MS_DELTA)

    # Time
    elif isinstance(obj, dt.time):
        return (obj.hour * 3600 + obj.minute * 60 + obj.second) * 1000 + obj.microsecond / 1000.

def convert_datetime_array(array):
    ''' Convert NumPy datetime arrays to arrays to milliseconds since epoch.

    Args:
        array : (obj)
            A NumPy array of datetime to convert

            If the value passed in is not a NumPy array, it will be returned as-is.

    Returns:
        array

    '''

    if not isinstance(array, np.ndarray):
        return array

    # not quite correct, truncates to ms..
    if array.dtype.kind == 'M':
        array =  array.astype('datetime64[us]').astype('int64') / 1000.

    elif array.dtype.kind == 'm':
        array = array.astype('timedelta64[us]').astype('int64') / 1000.

    # XXX (bev) special case dates, not great
    elif array.dtype.kind == 'O' and len(array) > 0 and isinstance(array[0], dt.date):
        try:
            array = array.astype('datetime64[us]').astype('int64') / 1000.
        except Exception:
            pass

    return array

def make_id():
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
            return str(_simple_id)
    else:
        return make_globally_unique_id()

def make_globally_unique_id():
    ''' Return a globally unique UUID.

    Some situations, e.g. id'ing dynamically created Divs in HTML documents,
    always require globally unique IDs.

    Returns:
        str

    '''
    return str(uuid.uuid4())

def array_encoding_disabled(array):
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

array_encoding_disabled.__doc__ = format_docstring(array_encoding_disabled.__doc__,
                                                   binary_array_types="\n    ".join("* ``np." + str(x) + "``"
                                                                                    for x in BINARY_ARRAY_TYPES))

def transform_array(array, force_list=False, buffers=None):
    ''' Transform a NumPy arrays into serialized format

    Converts un-serializable dtypes and returns JSON serializable
    format

    Args:
        array (np.ndarray) : a NumPy array to be transformed
        force_list (bool, optional) : whether to only output to standard lists
            This function can encode some dtypes using a binary encoding, but
            setting this argument to True will override that and cause only
            standard Python lists to be emitted. (default: False)

        buffers (set, optional) :
            If binary buffers are desired, the buffers parameter may be
            provided, and any columns that may be sent as binary buffers
            will be added to the set. If None, then only base64 encoding
            will be used (default: None)

            If force_list is True, then this value will be ignored, and
            no buffers will be generated.

            **This is an "out" parameter**. The values it contains will be
            modified in-place.


    Returns:
        JSON

    '''

    array = convert_datetime_array(array)

    return serialize_array(array, force_list=force_list, buffers=buffers)

def transform_array_to_list(array):
    ''' Transforms a NumPy array into a list of values

    Args:
        array (np.nadarray) : the NumPy array series to transform

    Returns:
        list or dict

    '''
    if (array.dtype.kind in ('u', 'i', 'f') and (~np.isfinite(array)).any()):
        transformed = array.astype('object')
        transformed[np.isnan(array)] = 'NaN'
        transformed[np.isposinf(array)] = 'Infinity'
        transformed[np.isneginf(array)] = '-Infinity'
        return transformed.tolist()
    elif (array.dtype.kind == 'O' and pd and pd.isnull(array).any()):
        transformed = array.astype('object')
        transformed[pd.isnull(array)] = 'NaN'
        return transformed.tolist()
    return array.tolist()

def transform_series(series, force_list=False, buffers=None):
    ''' Transforms a Pandas series into serialized form

    Args:
        series (pd.Series) : the Pandas series to transform
        force_list (bool, optional) : whether to only output to standard lists
            This function can encode some dtypes using a binary encoding, but
            setting this argument to True will override that and cause only
            standard Python lists to be emitted. (default: False)

        buffers (set, optional) :
            If binary buffers are desired, the buffers parameter may be
            provided, and any columns that may be sent as binary buffers
            will be added to the set. If None, then only base64 encoding
            will be used (default: None)

            If force_list is True, then this value will be ignored, and
            no buffers will be generated.

            **This is an "out" parameter**. The values it contains will be
            modified in-place.

    Returns:
        list or dict

    '''
    # not checking for pd here, this function should only be called if it
    # is already known that series is a Pandas Series type
    if isinstance(series, pd.PeriodIndex):
        vals = series.to_timestamp().values
    else:
        vals = series.values
    return transform_array(vals, force_list=force_list, buffers=buffers)

def serialize_array(array, force_list=False, buffers=None):
    ''' Transforms a NumPy array into serialized form.

    Args:
        array (np.ndarray) : the NumPy array to transform
        force_list (bool, optional) : whether to only output to standard lists
            This function can encode some dtypes using a binary encoding, but
            setting this argument to True will override that and cause only
            standard Python lists to be emitted. (default: False)

        buffers (set, optional) :
            If binary buffers are desired, the buffers parameter may be
            provided, and any columns that may be sent as binary buffers
            will be added to the set. If None, then only base64 encoding
            will be used (default: None)

            If force_list is True, then this value will be ignored, and
            no buffers will be generated.

            **This is an "out" parameter**. The values it contains will be
            modified in-place.

    Returns:
        list or dict

    '''
    if isinstance(array, np.ma.MaskedArray):
        array = array.filled(np.nan)  # Set masked values to nan
    if (array_encoding_disabled(array) or force_list):
        return transform_array_to_list(array)
    if not array.flags['C_CONTIGUOUS']:
        array = np.ascontiguousarray(array)
    if buffers is None:
        return encode_base64_dict(array)
    else:
        return encode_binary_dict(array, buffers)

def traverse_data(obj, buffers=None):
    ''' Recursively traverse an object until a flat list is found.

    The flat list is converted to a numpy array and passed to transform_array()
    to handle ``nan``, ``inf``, and ``-inf``.

    Args:
        obj (list) : a list of values or lists

    '''
    if all(isinstance(el, np.ndarray) for el in obj):
        return [transform_array(el, buffers=buffers) for el in obj]
    obj_copy = []
    for item in obj:
        # Check the base/common case first for performance reasons
        # Also use type(x) is float because it's faster than isinstance
        if type(item) is float:
            if isnan(item):
                item = 'NaN'
            elif isinf(item):
                if item > 0:
                    item = 'Infinity'
                else:
                    item = '-Infinity'
            obj_copy.append(item)
        elif isinstance(item, (list, tuple)):  # check less common type second
            obj_copy.append(traverse_data(item))
        else:
            obj_copy.append(item)
    return obj_copy

def transform_column_source_data(data, buffers=None, cols=None):
    ''' Transform ``ColumnSourceData`` data to a serialized format

    Args:
        data (dict) : the mapping of names to data columns to transform

        buffers (set, optional) :
            If binary buffers are desired, the buffers parameter may be
            provided, and any columns that may be sent as binary buffers
            will be added to the set. If None, then only base64 encoding
            will be used (default: None)

            **This is an "out" parameter**. The values it contains will be
            modified in-place.

        cols (list[str], optional) :
            Optional list of subset of columns to transform. If None, all
            columns will be transformed (default: None)

    Returns:
        JSON compatible dict

    '''
    to_transform = set(data) if cols is None else set(cols)

    data_copy = {}
    for key in to_transform:
        if pd and isinstance(data[key], (pd.Series, pd.Index)):
            data_copy[key] = transform_series(data[key], buffers=buffers)
        elif isinstance(data[key], np.ndarray):
            data_copy[key] = transform_array(data[key], buffers=buffers)
        else:
            data_copy[key] = traverse_data(data[key], buffers=buffers)

    return data_copy

def encode_binary_dict(array, buffers):
    ''' Send a numpy array as an unencoded binary buffer

    The encoded format is a dict with the following structure:

    .. code:: python

        {
            '__buffer__' :  << an ID to locate the buffer >>,
            'shape'      : << array shape >>,
            'dtype'      : << dtype name >>,
            'order'      : << byte order at origin (little or big)>>
        }

    Args:
        array (np.ndarray) : an array to encode

        buffers (set) :
            Set to add buffers to

            **This is an "out" parameter**. The values it contains will be
            modified in-place.

    Returns:
        dict

    '''
    buffer_id = make_id()
    buf = (dict(id=buffer_id), array.tobytes())
    buffers.append(buf)

    return {
        '__buffer__'  : buffer_id,
        'shape'       : array.shape,
        'dtype'       : array.dtype.name,
        'order'       : sys.byteorder
    }

def encode_base64_dict(array):
    ''' Encode a NumPy array using base64:

    The encoded format is a dict with the following structure:

    .. code:: python

        {
            '__ndarray__' : << base64 encoded array data >>,
            'shape'       : << array shape >>,
            'dtype'       : << dtype name >>,
        }

    Args:

        array (np.ndarray) : an array to encode

    Returns:
        dict

    '''
    return {
        '__ndarray__'  : base64.b64encode(array.data).decode('utf-8'),
        'shape'        : array.shape,
        'dtype'        : array.dtype.name
    }

def decode_base64_dict(data):
    ''' Decode a base64 encoded array into a NumPy array.

    Args:
        data (dict) : encoded array data to decode

    Data should have the format encoded by :func:`encode_base64_dict`.

    Returns:
        np.ndarray

    '''
    b64 = base64.b64decode(data['__ndarray__'])
    array = np.copy(np.frombuffer(b64, dtype=data['dtype']))
    if len(data['shape']) > 1:
        array = array.reshape(data['shape'])
    return array

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_simple_id = 999
_simple_id_lock = Lock()

_dt_tuple = tuple(DATETIME_TYPES)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
