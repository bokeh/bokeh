''' Provide decorators help with define Bokeh validation checks.

'''
from __future__ import absolute_import

from functools import partial

from six import string_types

def _validator(code_or_name, validator_type):

    if validator_type == "error":
        from .errors import codes
        from .errors import EXT
    elif validator_type == "warning":
        from .warnings import codes
        from .warnings import EXT
    else:
        pass

    def decorator(func):
        def wrapper(*args, **kw):
            extra = func(*args, **kw)
            if extra is None: return []
            if isinstance(code_or_name, string_types):
                code = EXT
                name = codes[code][0] + ":" + code_or_name
            else:
                code = code_or_name
                name = codes[code][0]
            text = codes[code][1]
            return [(code, name, text, extra)]
        wrapper.validator_type = validator_type
        return wrapper

    return decorator

error = partial(_validator, validator_type="error")

warning = partial(_validator, validator_type="warning")
