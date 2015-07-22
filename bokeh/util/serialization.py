""" Functions for helping with serialization and deserialization of
Bokeh objects.

"""
from __future__ import absolute_import

from six import iterkeys

is_numpy = None

try:
    import numpy as np
    is_numpy = True
except ImportError:
    is_numpy = False

try:
    import pandas as pd
    is_pandas = True
except ImportError:
    is_pandas = False

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

def urljoin(*args):
    """ Construct an absolute URL from several URL components.

    Args:
        *args (str) : URL components to join

    Returns:
        str : joined URL

    """
    from six.moves.urllib.parse import urljoin as sys_urljoin
    from functools import reduce
    return reduce(sys_urljoin, args)

def get_json(response):
    """ Unify retrieving JSON responses from different sources.

    Works correctly for HTTP responses from requests <=1.0, >1.0, and
    the Flask test client.

    Args:
        response (Flask or requests response) : a response to process

    Returns:
        JSON

    """
    import json
    try:
        import flask
    except ImportError:
        flask = None
    if flask and isinstance(response, flask.Response):
        # flask testing
        return json.loads(response.data.decode('utf-8'))
    else:
        # requests
        if hasattr(response.json, '__call__'):
            return response.json()
        else:
            return response.json

def dump(objs, docid, changed_only=True):
    """ Serialize a sequence of Bokeh objects into JSON

        Args:
            objs (seq[obj]) : a sequence of Bokeh object to dump
            docid (str) : an ID for a Bokeh Document to dump relative to
            changed_only (bool, optional) : whether to dump only attributes
                that have had their values changed at some point (default: True)

        Returns:
            list[json]
    """
    json_objs = []
    for obj in objs:
        ref = obj.ref
        ref["attributes"] = obj.vm_serialize(changed_only=changed_only)
        ref["attributes"].update({"id": ref["id"], "doc" : docid})
        json_objs.append(ref)
    return json_objs

def is_ref(frag):
    """ Test whether a given Bokeh object graph fragment is a reference.

    A Bokeh "reference" is a ``dict`` with ``"type"`` and ``"id"`` keys.

    Args:
        frag (dict) : a fragment of a Bokeh object graph

    Returns:
        True, if the fragment is a reference, otherwise False

    """
    return isinstance(frag, dict) and \
           frag.get('type') and \
           frag.get('id')

def json_apply(fragment, check_func, func):
    """ Apply a function to JSON fragments that match the given predicate
    and return the collected results.

    Recursively traverses a nested collection of ``dict`` and ``list``,
    applying ``check_func`` to each fragment. If True, then collect
    ``func(fragment)`` in the final output

    Args:
        fragment (JSON-like) : the fragment to apply ``func`` to recursively
        check_func (callable) : the predicate to test fragments with
        func (callable) : the conversion function to apply

    Returns:
        converted fragments

    """
    if check_func(fragment):
        return func(fragment)
    elif isinstance(fragment, list):
        output = []
        for val in fragment:
            output.append(json_apply(val, check_func, func))
        return output
    elif isinstance(fragment, dict):
        output = {}
        for k, val in fragment.items():
            output[k] = json_apply(val, check_func, func)
        return output
    else:
        return fragment

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
        if is_pandas and isinstance(data[key], (pd.Series, pd.Index)):
            data_copy[key] = transform_series(data[key])
        elif isinstance(data[key], np.ndarray):
            data_copy[key] = transform_array(data[key])
        else:
            data_copy[key] = traverse_data(data[key])
    return data_copy
