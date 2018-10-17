#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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

__all__ = (
    'check_integrity',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

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
