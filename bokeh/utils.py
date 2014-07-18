import platform
import sys
import math
from six.moves.urllib.parse import urljoin as sys_urljoin
import copy
from functools import reduce

def urljoin(*args):
    return reduce(sys_urljoin, args)

def get_json(request):
    """request from requests library handles backwards compatability for
    requests < 1.0
    """
    if hasattr(request.json, '__call__'):
        return request.json()
    else:
        return request.json

def encode_utf8(u):
    if sys.version_info[0] == 2:
        u = u.encode('utf-8')
    return u

def decode_utf8(u):
    if sys.version_info[0] == 2:
        u = u.decode('utf-8')
    return u

_scales = [1e0, 1e3, 1e6, 1e9]
_units = ['s', 'ms', 'us', 'ns']

def scale_delta(time):
    if time > 0.0:
        order = min(-int(math.floor(math.log10(time)) // 3), 3)
    else:
        order = 3

    return time*_scales[order], _units[order]

def is_py3():
    return sys.version_info[0] == 3

def is_pypy():
    return platform.python_implementation() == "PyPy"

def json_apply(json_obj, func):
    processed = set()
    queue = [json_obj]
    while queue:
        node = queue.pop(0)
        if id(node) in processed:
            continue
        func(node)
        processed.add(id(node))
        if isinstance(node, list):
            for idx, x in enumerate(node):
                queue.append(x)
        if isinstance(node, dict):
            for k,v in node.iteritems():
                queue.append(v)

def get_ref(obj):
    return obj.get_ref()

def convert_references(json_obj):
    from .plot_object import PlotObject
    from .properties import HasProps
    def convert(obj):
        if isinstance(obj, PlotObject):
            return get_ref(obj)
        elif isinstance(obj, HasProps):
            return obj.to_dict()
        else:
            return obj
    def helper(json_obj):
        if isinstance(json_obj, list):
            for idx, x in enumerate(json_obj):
                json_obj[idx] = convert(x)
        if isinstance(json_obj, dict):
            for k, x in json_obj.iteritems():
                json_obj[k] = convert(x)
    json_apply(json_obj, helper)
    return json_obj

def dump(objs, docid):
    json_objs = []
    for obj in objs:
        ref = get_ref(obj)
        ref["attributes"] = obj.vm_serialize()
        ref["attributes"].update({"id": ref["id"], "doc" : docid})
        json_objs.append(ref)
    return json_objs

def nice_join(seq, sep=", "):
    seq = [str(x) for x in seq]

    if len(seq) <= 1:
        return sep.join(seq)
    else:
        return "%s or %s" % (sep.join(seq[:-1]), seq[-1])

def publish_display_data(data, source='bokeh'):
    """Compatibility wrapper for IPython publish_display_data which removes the
    `source` (first) argument in later versions.

    Parameters
    ----------
    source : str
    data : dict
    """
    import IPython.core.displaypub as displaypub
    try:
        displaypub.publish_display_data(source, data)
    except TypeError:
        displaypub.publish_display_data(data)
