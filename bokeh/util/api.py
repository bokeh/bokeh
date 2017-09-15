#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
logger = logging.getLogger(__name__)

# This one module is exempted from this :)
# from bokeh.util.api import public, internal ; public, internal

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
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
        __bklevel__ = 'internal'

    Args:
        version (tuple) :
            A version tuple ``(x,y,z)`` stating what version this object was
            introduced.

    Returns:
        Class or Function

    '''
    return _access(version, 'internal')

def is_declared(obj):
    '''

    '''
    return hasattr(obj, '__bklevel__') and hasattr(obj, '__bkversion__')

def is_level(obj, level):
    '''

    '''
    return obj.__bklevel__ == level

def is_version(obj, version):
    '''

    '''
    return obj.__bkversion__ == version

def public(version):
    ''' Declare an object to be ``'public'``, introduced in ``version``.

    This decorator annotates a function or class with information about what
    version it was first introduced in, as well as that it is part of the
    internal API. Specifically, the decorated object will have attributes:

    .. code-block:: python

        __bkversion__ = version
        __bklevel__ = 'public'

    Args:
        version (tuple) :
            A version tuple ``(x,y,z)`` stating what version this object was
            introduced.

    Returns:
        Class or Function

    '''
    return _access(version, 'public')

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

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
    assert level in [PUBLIC, INTERNAL]

    def decorator(obj):
        import sys
        if isinstance(obj, property):
            modname = obj.fget.__module__
        else:
            modname = obj.__module__
        mod = sys.modules[modname]
        if not hasattr(mod, '__bkapi__'):
            mod.__bkapi__ = {PUBLIC: 0, INTERNAL:0}
        mod.__bkapi__[level] += 1

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
