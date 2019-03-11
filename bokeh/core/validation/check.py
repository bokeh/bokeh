#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the ``check_integrity`` function.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------
__silencers__ = set()

__all__ = (
    'check_integrity',
    'silence'
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def silence(name, silence=True):
    ''' Silence named warning on all Bokeh models.

    Args:
        name (str) : Names of warnings to silence
        silence (bool) : Whether or not to silence the warning

    Returns:
        A set containing the names of all silenced warnings

    This function adds or removes names from a set of silencers which
    is refered to when running ``check_integrity``. If a warning with a particular
    name is added to the silencers - then it will never be raised.

    .. code-block:: python

        >>> silence('EMPTY_LAYOUT', True)
        {'EMPTY_LAYOUT'}

        >>> empty_row = Row

        >>> check_integrity([empty_row])

    '''
    if isinstance(name, int):
        raise ValueError('Input to silence should be name of warning - not code')
    if silence:
        __silencers__.add(name)
    else:
        __silencers__.remove(name)
    return __silencers__


def check_integrity(models):
    ''' Apply validation and integrity checks to a collection of Bokeh models.

    Args:
        models (seq[Model]) : a collection of Models to test

    Returns:
        None

    This function will emit log warning and error messages for all error or
    warning conditions that are detected. For example, layouts without any
    children will trigger a warning:

    .. code-block:: python

        >>> empty_row = Row

        >>> check_integrity([empty_row])
        W-1002 (EMPTY_LAYOUT): Layout has no children: Row(id='2404a029-c69b-4e30-9b7d-4b7b6cdaad5b', ...)

    '''
    messages = dict(error=[], warning=[])

    for model in models:
        validators = []
        for name in dir(model):
            if not name.startswith("_check"): continue
            obj = getattr(model, name)
            if getattr(obj, "validator_type", None):
                validators.append(obj)
        for func in validators:
            messages[func.validator_type].extend(func())

    for msg in sorted(messages['error']):
        log.error("E-%d (%s): %s: %s" % msg)

    for msg in sorted(messages['warning']):
        code, name, desc, obj = msg
        if name not in __silencers__:
            log.warning("W-%d (%s): %s: %s" % msg)

    # This will be turned on in a future release
    # if len(messages['error']) or (len(messages['warning']) and settings.strict()):
    #     raise RuntimeError("Errors encountered during validation (see log output)")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
