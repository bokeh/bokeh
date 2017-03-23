"""
Functions for helping with serialization and deserialization of
Bokeh objects.

Certain NunPy array dtypes can be serialized to a binary format for
performance and efficiency. The list of supported dtypes is:

%s

"""
from __future__ import absolute_import

import base64
import math

from six import iterkeys

from .dependencies import import_optional

is_numpy = None

try:
    import numpy as np
    is_numpy = True
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
except ImportError:
    is_numpy = False
    BINARY_ARRAY_TYPES = set()

__doc__ = __doc__ % ("\n".join("* ``np." + str(x) + "``" for x in BINARY_ARRAY_TYPES))

pd = import_optional('pandas')

import logging
log = logging.getLogger(__name__)

_simple_id = 1000

def make_id():
    """ Return a new unique ID for a Bokeh object.

    Normally this function will return UUIDs to use for identifying Bokeh
    objects. This is especally important for Bokeh objects stored on a
    Bokeh server. However, it is convenient to have more human-readable
    IDs during development, so this behavior can be overridden by
    setting the environment variable ``BOKEH_SIMPLE_IDS=yes``.

    """
    global _simple_id

    import uuid
    from ..settings import settings

    if settings.simple_ids(False):
        _simple_id += 1
        new_id = _simple_id
    else:
        new_id = uuid.uuid4()
    return str(new_id)

def array_encoding_disabled(array):
    """ Determine whether an array may be binary encoded.

    The NumPy array dtypes that can be encoded are:

    %s

    Args:
        array (np.ndarray) : the array to check

    Returns:
        bool

    """

    # disable binary encoding for non-supported dtypes
    return array.dtype not in BINARY_ARRAY_TYPES

array_encoding_disabled.__doc__ = array_encoding_disabled.__doc__ % ("\n    ".join("* ``np." + str(x) + "``" for x in BINARY_ARRAY_TYPES))

def transform_array(array, force_list=False):
    """ Transform a NumPy arrays into serialized format

    Converts un-serializable dtypes and returns JSON serializable
    format

    Args:
        array (np.ndarray) : a NumPy array to be transformed
        force_list (bool, optional) : whether to only output to standard lists
            This function can encode some dtypes using a binary encoding, but
            setting this argument to True will override that and cause only
            standard Python lists to be emitted. (default: False)

    Returns:
        JSON

    """

    # Check for astype failures (putative Numpy < 1.7)
    try:
        dt2001 = np.datetime64('2001')
        legacy_datetime64 = (dt2001.astype('int64') ==
                             dt2001.astype('datetime64[ms]').astype('int64'))
    except AttributeError as e:
        if e.args == ("'module' object has no attribute 'datetime64'",):
            import sys
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

    return serialize_array(array, force_list)

def transform_array_to_list(array):
    """ Transforms a NumPy array into a list of values

    Args:
        array (np.nadarray) : the NumPy array series to transform

    Returns:
        list or dict

    """
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

def transform_series(series, force_list=False):
    """ Transforms a Pandas series into serialized form

    Args:
        series (pd.Series) : the Pandas series to transform
        force_list (bool, optional) : whether to only output to standard lists
            This function can encode some dtypes using a binary encoding, but
            setting this argument to True will override that and cause only
            standard Python lists to be emitted. (default: False)

    Returns:
        list or dict

    """
    vals = series.values
    return transform_array(vals, force_list)

def serialize_array(array, force_list=False):
    """ Transforms a NumPy array into serialized form.

    Args:
        array (np.ndarray) : the NumPy array to transform
        force_list (bool, optional) : whether to only output to standard lists
            This function can encode some dtypes using a binary encoding, but
            setting this argument to True will override that and cause only
            standard Python lists to be emitted. (default: False)

    Returns:
        list or dict

    """
    if isinstance(array, np.ma.MaskedArray):
        array = array.filled(np.nan)  # Set masked values to nan
    if (array_encoding_disabled(array) or force_list):
        return transform_array_to_list(array)
    if not array.flags['C_CONTIGUOUS']:
        array = np.ascontiguousarray(array)
    return encode_base64_dict(array)

def traverse_data(obj, is_numpy=is_numpy, use_numpy=True):
    """ Recursively traverse an object until a flat list is found.

    If NumPy is available, the flat list is converted to a numpy array
    and passed to transform_array() to handle ``nan``, ``inf``, and
    ``-inf``.

    Otherwise, iterate through all items, converting non-JSON items

    Args:
        obj (list) : a list of values or lists
        is_numpy (bool, optional): Whether NumPy is availanble
            (default: True if NumPy is importable)
        use_numpy (bool, optional) toggle NumPy as a dependency for testing
            This argument is only useful for testing (default: True)
    """
    is_numpy = is_numpy and use_numpy
    if is_numpy and all(isinstance(el, np.ndarray) for el in obj):
        return [transform_array(el) for el in obj]
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

def transform_column_source_data(data):
    """ Transform ColumnSourceData data to a serialized format

    Args:
        data (dict) : the mapping of names to data columns to transform

    Returns:
        JSON compatible dict

    """
    data_copy = {}
    for key in iterkeys(data):
        if pd and isinstance(data[key], (pd.Series, pd.Index)):
            data_copy[key] = transform_series(data[key])
        elif isinstance(data[key], np.ndarray):
            data_copy[key] = transform_array(data[key])
        else:
            data_copy[key] = traverse_data(data[key])
    return data_copy

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
    """ Decode a base64 encoded array into a NumPy array.

    Args:
        data (dict) : encoded array data to decode

    Data should have the format encoded by :func:`encode_base64_dict`.

    Returns:
        np.ndarray

    """
    b64 = base64.b64decode(data['__ndarray__'])
    array = np.fromstring(b64, dtype=data['dtype'])
    if len(data['shape']) > 1:
        array = array.reshape(data['shape'])
    return array
