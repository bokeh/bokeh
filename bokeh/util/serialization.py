'''
Functions for helping with serialization and deserialization of
Bokeh objects.

Certain NunPy array dtypes can be serialized to a binary format for
performance and efficiency. The list of supported dtypes is:

{binary_array_types}

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

import base64
import datetime as dt
import math
import sys
import uuid

import numpy as np

from ..settings import settings
from .string import format_docstring
from .dependencies import import_optional

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
    dt.datetime,
    dt.timedelta,
    dt.date,
    dt.time,
    np.datetime64,
    np.timedelta64
])

if pd:
    try:
        _pd_timestamp = pd.Timestamp
    except AttributeError:
        _pd_timestamp = pd.tslib.Timestamp
    DATETIME_TYPES.add(_pd_timestamp)
    DATETIME_TYPES.add(pd.Timedelta)

NP_EPOCH = np.datetime64(0, 'ms')
NP_MS_DELTA = np.timedelta64(1, 'ms')

DT_EPOCH = dt.datetime.utcfromtimestamp(0)

__doc__ = format_docstring(__doc__, binary_array_types="\n".join("* ``np." + str(x) + "``" for x in BINARY_ARRAY_TYPES))

_simple_id = 1000

_dt_tuple = tuple(DATETIME_TYPES)

def is_datetime_type(obj):
    ''' Whether an object is any date, datetime, or time delta type
    recognized by Bokeh.

    Arg:
        obj (object) : the object to test

    Returns:
        bool : True if ``obj`` is a datetime type

    '''
    return isinstance(obj, _dt_tuple)

def convert_datetime_type(obj):
    ''' Convert any recognized date, datetime or time delta value to
    floating point milliseconds

    Date and Datetime values are converted to milliseconds since epoch.

    TimeDeleta values are converted to absolute milliseconds.

    Arg:
        obj (object) : the object to convert

    Returns:
        float : milliseconds

    '''
    # Pandas Timestamp
    if pd and isinstance(obj, _pd_timestamp): return obj.value / 10**6.0

    # Pandas Timedelta
    elif pd and isinstance(obj, pd.Timedelta): return obj.value / 10**6.0

    # Datetime (datetime is a subclass of date)
    elif isinstance(obj, dt.datetime):
        diff = obj.replace(tzinfo=None) - DT_EPOCH
        return diff.total_seconds() * 1000.

    # Timedelta (timedelta is class in the datetime library)
    elif isinstance(obj, dt.timedelta):
        return obj.total_seconds() * 1000.

    # Date
    elif isinstance(obj, dt.date):
        return (dt.datetime(*obj.timetuple()[:6]) - DT_EPOCH).total_seconds() * 1000

    # NumPy datetime64
    elif isinstance(obj, np.datetime64):
        epoch_delta = obj - NP_EPOCH
        return (epoch_delta / NP_MS_DELTA)

    # Numpy timedelta64
    elif isinstance(obj, np.timedelta64):
        return (obj / NP_MS_DELTA)

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

    try:
        dt2001 = np.datetime64('2001')
        legacy_datetime64 = (dt2001.astype('int64') ==
                             dt2001.astype('datetime64[ms]').astype('int64'))
    except AttributeError as e:
        if e.args == ("'module' object has no attribute 'datetime64'",):
            # for compatibility with PyPy that doesn't have datetime64
            if 'PyPy' in sys.version:
                legacy_datetime64 = False
                pass
            else:
                raise e
        else:
            raise e

    # not quite correct, truncates to ms..
    if array.dtype.kind == 'M':
        if legacy_datetime64:
            if array.dtype == np.dtype('datetime64[ns]'):
                array = array.astype('int64') / 10**6.0
        else:
            array =  array.astype('datetime64[us]').astype('int64') / 1000.

    elif array.dtype.kind == 'm':
        array = array.astype('timedelta64[us]').astype('int64') / 1000.

    return array

def make_id():
    ''' Return a new unique ID for a Bokeh object.

    Normally this function will return UUIDs to use for identifying Bokeh
    objects. This is especally important for Bokeh objects stored on a
    Bokeh server. However, it is convenient to have more human-readable
    IDs during development, so this behavior can be overridden by
    setting the environment variable ``BOKEH_SIMPLE_IDS=yes``.

    '''
    global _simple_id

    if settings.simple_ids(False):
        _simple_id += 1
        new_id = _simple_id
    else:
        new_id = uuid.uuid4()
    return str(new_id)

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
            will be added to the set. If None, then only base64 encodinfg
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
            will be added to the set. If None, then only base64 encodinfg
            will be used (default: None)

            If force_list is True, then this value will be ignored, and
            no buffers will be generated.

            **This is an "out" parameter**. The values it contains will be
            modified in-place.

    Returns:
        list or dict

    '''
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
            will be added to the set. If None, then only base64 encodinfg
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

def traverse_data(obj, use_numpy=True, buffers=None):
    ''' Recursively traverse an object until a flat list is found.

    If NumPy is available, the flat list is converted to a numpy array
    and passed to transform_array() to handle ``nan``, ``inf``, and
    ``-inf``.

    Otherwise, iterate through all items, converting non-JSON items

    Args:
        obj (list) : a list of values or lists
        use_numpy (bool, optional) toggle NumPy as a dependency for testing
            This argument is only useful for testing (default: True)
    '''
    if use_numpy and all(isinstance(el, np.ndarray) for el in obj):
        return [transform_array(el, buffers=buffers) for el in obj]
    obj_copy = []
    for item in obj:
        # Check the base/common case first for performance reasons
        # Also use type(x) is float because it's faster than isinstance
        if type(item) is float:
            if math.isnan(item):
                item = 'NaN'
            elif math.isinf(item):
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
    ''' Transform ColumnSourceData data to a serialized format

    Args:
        data (dict) : the mapping of names to data columns to transform

        buffers (set, optional) :
            If binary buffers are desired, the buffers parameter may be
            provided, and any columns that may be sent as binary buffers
            will be added to the set. If None, then only base64 encodinfg
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
    array = np.fromstring(b64, dtype=data['dtype'])
    if len(data['shape']) > 1:
        array = array.reshape(data['shape'])
    return array
