""" Functions for helping with serialization and deserialization of
Bokeh objects.

"""
from __future__ import absolute_import

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