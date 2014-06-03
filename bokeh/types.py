from functools import wraps
from six import iteritems

from .properties import Property

_do_type_check = False

def _type_check(func, type_spec):
    pass

def sig(**type_spec):
    for key, val in iteritems(type_spec):
        if isinstance(val, Property):
            continue
        elif issubclass(val, Property):
            type_spec[key] = val()
        else:
            raise ValueError("%s=%r is not a valid type specification" % (key, val))

    def sig_decorator(func):
        if not _do_type_check:
            return func
        else:
            @wraps(func)
            def wrapped_func(*args, **kwargs):
                _type_check(func, type_spec)
                return func(*args, **kwargs)

            return wrapped_func

    return sig_decorator
