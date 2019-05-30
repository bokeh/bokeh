#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Utilities for Py2/Py3 interop.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'format_signature',
    'get_param_info',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# handle collections ABC changes
try:
    # only works on python 3.3+ but Bokeh only support python 3.4+
    import collections.abc as collections_abc # NOQA
except ImportError:
    import collections as collections_abc # NOQA

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# There is a problem with using @wraps decorator in combination with functools.partial.
# This issue is not present in Python 3.
# This redefinition will be triggered only if issue affects user,
# otherwise regular definition of @wraps will be used.
#
# this code snippet was originally posted in following stack overflow discussion:
# http://stackoverflow.com/a/28752007

from functools import wraps, partial, WRAPPER_ASSIGNMENTS

try:
    wraps(partial(wraps))(wraps)
except AttributeError:
    @wraps(wraps)
    def wraps(obj, attr_names=WRAPPER_ASSIGNMENTS, wraps=wraps):
        return wraps(obj, assigned=(name for name in attr_names if hasattr(obj, name)))

del partial, WRAPPER_ASSIGNMENTS


# inspect.getargspec and inspect.formatargspec were deprecated in Python 3.5
# in favor of the newer inspect.signature introspection

if sys.version_info[:2] < (3, 4):

    def signature(func):
        # The modifications in this function are to make results more in line
        # with Python 3, i.e. self is not included in bound methods, supplied
        # parameters are not reported in partial, etc. This simplifies the
        # downstream code considerably.
        from inspect import getargspec, isfunction, ismethod
        from functools import partial

        if isfunction(func) or ismethod(func):
            sig = getargspec(func)
            if ismethod(func):
                sig.args.remove('self')
            return sig

        elif isinstance(func, partial):
            sig = getargspec(func.func)
            if 'self' in sig.args: sig.args.remove('self')
            if func.keywords is not None:
                for name in func.keywords.keys():
                    sig.args.remove(name)
            for val in func.args:
                del sig.args[0]
            return sig

        else:
            sig = getargspec(func.__call__)
            sig.args.remove('self')
            return sig

    def format_signature(sig):
        from inspect import formatargspec
        return formatargspec(*sig)

    def get_param_info(sig):
        return (sig.args, sig.defaults or [])

else:
    from inspect import signature; signature

    def format_signature(sig):
        return str(sig)

    def get_param_info(sig):
        defaults = []
        for param in sig.parameters.values():
            if param.default is not param.empty:
                defaults.append(param.default)
        return list(sig.parameters), defaults
