''' Provide decorators help with define Bokeh validation checks.

'''
from __future__ import absolute_import

from functools import partial

from six import string_types

def _validator(code_or_name, validator_type):
    ''' Internal shared implementation to handle both error and warning
    validation checks.

    Args:
        code code_or_name (int or str) : a defined error code or custom message
        validator_type (str) : either "error" or "warning"

    Returns:
        validation decorator

    '''
    if validator_type == "error":
        from .errors import codes
        from .errors import EXT
    elif validator_type == "warning":
        from .warnings import codes
        from .warnings import EXT
    else:
        pass # TODO (bev) ValueError?

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

_error = partial(_validator, validator_type="error")
def error(code_or_name):
    ''' Decorator to mark a validator method for a Bokeh error condition

    Args:
        code_or_name (int or str) : a code from ``bokeh.validation.errors`` or a string label for a custom check

    Returns:
        callable : decorator for Bokeh model methods

    The function that is decoratate should have a name that starts with
    ``_check``, and return a string message in case a bad condition is
    detected, and ``None`` if no bad condition is detected.

    Examples:

    The first example uses a numeric code for a standard error provided in
    ``bokeh.validation.errors``. This usage is primarily of interest to Bokeh
    core developers.

    .. code-block:: python

        from bokeh.validation.errors import REQUIRED_RANGES

        @error(REQUIRED_RANGES)
        def _check_no_glyph_renderers(self):
            if bad_condition: return "message"

    The second example shows how a custom warning check can be implemented by
    passing an arbitrary string label to the decorator. This usage is primarily
    of interest to anyone extending Bokeh with their own custom models.

    .. code-block:: python

        @error("MY_CUSTOM_WARNING")
        def _check_my_custom_warning(self):
            if bad_condition: return "message"

    '''
    return _error(code_or_name)

_warning = partial(_validator, validator_type="warning")
def warning(code_or_name):
    ''' Decorator to mark a validator method for a Bokeh error condition

    Args:
        code_or_name (int or str) : a code from ``bokeh.validation.errors`` or a string label for a custom check

    Returns:
        callable : decorator for Bokeh model methods

    The function that is decoratate should have a name that starts with
    ``_check``, and return a string message in case a bad condition is
    detected, and ``None`` if no bad condition is detected.

    Examples:

    The first example uses a numeric code for a standard warning provided in
    ``bokeh.validation.warnings``. This usage is primarily of interest to Bokeh
    core developers.

    .. code-block:: python

        from bokeh.validation.warnings import NO_DATA_RENDERERS

        @warning(NO_DATA_RENDERERS)
        def _check_no_glyph_renderers(self):
            if bad_condition: return "message"

    The second example shows how a custom warning check can be implemented by
    passing an arbitrary string label to the decorator. This usage is primarily
    of interest to anyone extending Bokeh with their own custom models.

    .. code-block:: python

        @warning("MY_CUSTOM_WARNING")
        def _check_my_custom_warning(self):
            if bad_condition: return "message"

    '''
    return _warning(code_or_name)
