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

