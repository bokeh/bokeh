"""

"""
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

_simple_id = 1000

def make_id():
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
    from six.moves.urllib.parse import urljoin as sys_urljoin
    from functools import reduce
    return reduce(sys_urljoin, args)

def get_json(response):
    """unifying retrieving json from an http response, for requests <1.0, >1.0, and
    flask test client
    """
    import json
    import flask
    if isinstance(response, flask.Response):
        # flask testing
        return json.loads(response.data.decode('utf-8'))
    else:
        # requests
        if hasattr(response.json, '__call__'):
            return response.json()
        else:
            return response.json


def convert_references(json_obj):

    import iteritems
    from .plot_object import PlotObject
    from .properties import HasProps

    def convert(obj):
        if isinstance(obj, PlotObject):
            return obj.ref
        elif isinstance(obj, HasProps):
            return obj.to_dict()
        else:
            return obj

    def helper(json_obj):
        if isinstance(json_obj, list):
            for idx, x in enumerate(json_obj):
                json_obj[idx] = convert(x)
        if isinstance(json_obj, dict):
            for k, x in iteritems(json_obj):
                json_obj[k] = convert(x)

    json_apply(json_obj, helper)

    return json_obj

def dump(objs, docid, changed_only=True):
    """ Dump a sequence of objects into JSON

        Args:
            changed_only (bool, optional) : whether to dump only attributes
                that have had their values changed at some point (default: True)
    """
    json_objs = []
    for obj in objs:
        ref = obj.ref
        ref["attributes"] = obj.vm_serialize(changed_only=changed_only)
        ref["attributes"].update({"id": ref["id"], "doc" : docid})
        json_objs.append(ref)
    return json_objs

def is_ref(frag):
    return isinstance(frag, dict) and \
           frag.get('type') and \
           frag.get('id')

def json_apply(fragment, check_func, func):
    """recursively searches through a nested dict/lists
    if check_func(fragment) is True, then we return
    func(fragment)
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

def resolve_json(fragment, models):
    check_func = is_ref
    def func(fragment):
        if fragment['id'] in models:
            return models[fragment['id']]
        else:
            log.error("model not found for %s", fragment)
            return None
    return json_apply(fragment, check_func, func)
