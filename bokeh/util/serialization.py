""" Functions for helping with serialization and deserialization of
Bokeh objects.

"""
from __future__ import absolute_import

from six import iterkeys

from .dependencies import import_optional

is_numpy = None

try:
    import numpy as np
    is_numpy = True
except ImportError:
    is_numpy = False

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

def transform_series(obj):
    """transforms pandas series into array of values
    """
    vals = obj.values
    return transform_array(vals)

def transform_array(obj):
    """Transform arrays into lists of json safe types
    also handles pandas series, and replacing
    nans and infs with strings
    """
    # Check for astype failures (putative Numpy < 1.7)
    dt2001 = np.datetime64('2001')
    legacy_datetime64 = (dt2001.astype('int64') ==
                         dt2001.astype('datetime64[ms]').astype('int64'))
    ## not quite correct, truncates to ms..
    if obj.dtype.kind == 'M':
        if legacy_datetime64:
            if obj.dtype == np.dtype('datetime64[ns]'):
                return (obj.astype('int64') / 10**6.0).tolist()
        else:
            return (obj.astype('datetime64[us]').astype('int64') / 1000.).tolist()
    elif obj.dtype.kind in ('u', 'i', 'f'):
        return transform_numerical_array(obj)
    return obj.tolist()

def transform_numerical_array(obj):
    """handles nans/inf conversion
    """
    if isinstance(obj, np.ma.MaskedArray):
        obj = obj.filled(np.nan)  # Set masked values to nan
    if not np.isnan(obj).any() and not np.isinf(obj).any():
        return obj.tolist()
    else:
        transformed = obj.astype('object')
        transformed[np.isnan(obj)] = 'NaN'
        transformed[np.isposinf(obj)] = 'Infinity'
        transformed[np.isneginf(obj)] = '-Infinity'
        return transformed.tolist()

def traverse_data(datum, is_numpy=is_numpy, use_numpy=True):
    """recursively dig until a flat list is found
    if numpy is available convert the flat list to a numpy array
    and send off to transform_array() to handle nan, inf, -inf
    otherwise iterate through items in array converting non-json items

    Args:
        datum (list) : a list of values or lists
        is_numpy: True if numpy is present (see imports)
        use_numpy: toggle numpy as a dependency for testing purposes
    """
    is_numpy = is_numpy and use_numpy
    if is_numpy and not any(isinstance(el, (list, tuple)) for el in datum):
        return transform_array(np.asarray(datum))
    datum_copy = []
    for item in datum:
        if isinstance(item, (list, tuple)):
            datum_copy.append(traverse_data(item))
        elif isinstance(item, float):
            if np.isnan(item):
                item = 'NaN'
            elif np.isposinf(item):
                item = 'Infinity'
            elif np.isneginf(item):
                item = '-Infinity'
            datum_copy.append(item)
        else:
            datum_copy.append(item)
    return datum_copy

def transform_column_source_data(data):
    """iterate through the data of a ColumnSourceData object replacing
    non-JSON-compliant objects with compliant ones
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
