import platform
import sys
import math
from six.moves.urllib.parse import urljoin as sys_urljoin
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
