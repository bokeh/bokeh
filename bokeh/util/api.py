#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide functions for declaring Bokeh API information.

Within the Bokeh codebase, functions, classes, methods, and properties may
be defined to be "public" or "internal", as well as note what Bokeh version
the object was first introduced in.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
logger = logging.getLogger(__name__)

# This one module is exempted from this :)
# from bokeh.util.api import public, internal ; public, internal

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..util.string import nice_join, format_docstring
from .future import wraps

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

INTERNAL = 'internal'

PUBLIC = 'public'

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------o

def internal(version):
    ''' Declare an object to be ``'public'``, introduced in ``version``.

    This decorator annotates a function or class with information about what
    version it was first introduced in, as well as that it is part of the
    internal API. Specifically, the decorated object will have attributes:

    .. code-block:: python

        __bkversion__ = version
        __bklevel__ = {internal}

    Args:
        version (tuple) :
            A version tuple ``(x,y,z)`` stating what version this object was
            introduced.

    Returns:
        Class or Function

    '''
    return _access(version, 'internal')

internal.__doc__ = format_docstring(internal.__doc__, internal=repr(INTERNAL))

def is_declared(obj):
    '''

    Args:
        obj (object) :
            The function, class, method, or property to test
    Returns:
        bool

    '''
    return hasattr(obj, '__bklevel__') and hasattr(obj, '__bkversion__')

def is_level(obj, level):
    '''

    Args:
        obj (object) :
            The function, class, method, or property to declare a level for

        level ({public} or {internal})
            Whether to declare the object public or internal

    Returns:
        bool

    '''
    if level not in _LEVELS:
        raise ValueError("Unknown API level %r, expected %s" % (level, nice_join(_LEVELS)))
    return obj.__bklevel__ == level

is_level.__doc__ = format_docstring(is_level.__doc__, public=repr(PUBLIC), internal=repr(INTERNAL))

def is_version(obj, version):
    '''

    Args:
        obj (object) :
            The function, class, method, or property to declare a version for

    Returns:
        bool

    '''
    return obj.__bkversion__ == version

def public(version):
    ''' Declare an object to be ``'public'``, introduced in ``version``.

    This decorator annotates a function or class with information about what
    version it was first introduced in, as well as that it is part of the
    internal API. Specifically, the decorated object will have attributes:

    .. code-block:: python

        __bkversion__ = version
        __bklevel__ = {public}

    Args:
        version (tuple) :
            A version tuple ``(x,y,z)`` stating what version this object was
            introduced.

    Returns:
        Class or Function

    '''
    return _access(version, 'public')

public.__doc__ = format_docstring(public.__doc__, public=repr(PUBLIC))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_LEVELS = [PUBLIC, INTERNAL]

def _access(version, level):
    ''' Declare an object to be ``{{ level }}``, introduced in ``version``.

    This generic decorator annotates a function or class with information about
    what version it was first introduced in, as well as whether it is a public
    or internal API level. Specifically, the decorated object will have
    attributes:

    .. code-block:: python

        __bkversion__ = version
        __bklevel__ = level

    Args:
        version (tuple) :
            A version tuple ``(x,y,z)`` stating what version this object was
            introduced.

        level: (str)
            Whether this object is ``'public'`` or ``'internal'``

    Returns:
        Class or Function

    '''
    assert level in _LEVELS

    def decorator(obj):
        # Keep track of how many public/internal things there are declared
        # in a module so we can make sure api tests are comprehensive
        mod = _get_module(obj)
        _increment_api_count(mod, level)

        # If we are decorating a class
        if isinstance(obj, type):
            obj.__bkversion__ = version
            obj.__bklevel__ = level
            return obj

        # Otherwise we are decorating a function or method
        @wraps(obj)
        def wrapper(*args, **kw):
            return obj(*args, **kw)

        wrapper.__bkversion__ = version
        wrapper.__bklevel__ = level
        return wrapper

    return decorator

def _get_module(obj):
    ''' Given an function, class, method, or property, return the module
    that is was defined in.

    This function is written with the usages of the Bokeh codebase in
    mind, and may not work in general

    '''
    import sys
    if isinstance(obj, property):
        modname = obj.fget.__module__
    else:
        modname = obj.__module__
    return sys.modules[modname]

def _increment_api_count(mod, level):
    ''' Updates the __bkapi__ dict on a module, creating a new one if necessary

    '''
    if not hasattr(mod, '__bkapi__'):
        mod.__bkapi__ = {PUBLIC: 0, INTERNAL:0}
    mod.__bkapi__[level] += 1
