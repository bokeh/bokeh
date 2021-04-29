#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the ``check_integrity`` function.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import contextlib
from typing import Set

# Bokeh imports
from ...settings import settings

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__silencers__: Set[int] = set()

__all__ = (
    'check_integrity',
    'silence',
    'silenced',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def silence(warning: int, silence: bool = True) -> Set[int]:
    ''' Silence a particular warning on all Bokeh models.

    Args:
        warning (Warning) : Bokeh warning to silence
        silence (bool) : Whether or not to silence the warning

    Returns:
        A set containing the all silenced warnings

    This function adds or removes warnings from a set of silencers which
    is referred to when running ``check_integrity``. If a warning
    is added to the silencers - then it will never be raised.

    .. code-block:: python

        >>> from bokeh.core.validation.warnings import EMPTY_LAYOUT
        >>> bokeh.core.validation.silence(EMPTY_LAYOUT, True)
        {1002}

    To turn a warning back on use the same method but with the silence
    argument set to false

    .. code-block:: python

        >>> bokeh.core.validation.silence(EMPTY_LAYOUT, False)
        set()

    '''
    if not isinstance(warning, int):
        raise ValueError('Input to silence should be a warning object '
                         '- not of type {}'.format(type(warning)))
    if silence:
        __silencers__.add(warning)
    elif warning in __silencers__:
        __silencers__.remove(warning)
    return __silencers__

def is_silenced(warning):
    ''' Check if a warning has been silenced.

    Args:
        warning (Warning) : Bokeh warning to check

    Returns:
        bool

    '''
    return warning[0] in __silencers__

@contextlib.contextmanager
def silenced(warning: int) -> None:
    silence(warning, True)
    try:
        yield
    finally:
        silence(warning, False)

def check_integrity(models):
    ''' Collect all warnings associated with a collection of Bokeh models.

    Args:
        models (seq[Model]) : a collection of Models to test

    Returns:
        dict(error=[], warning=[]): A dictionary of all warning and error messages

    This function will return a dictionary containing all errors or
    warning conditions that are detected. For example, layouts without
    any children will add a warning to the dictionary:

    .. code-block:: python

        >>> empty_row = Row

        >>> check_integrity([empty_row])
        {
            "warning": [
                (1002, EMPTY_LAYOUT, Layout has no children, Row(id='2404a029-c69b-4e30-9b7d-4b7b6cdaad5b', ...),
                ...
            ],
            "error": [...]
        }

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

    return messages

def process_validation_issues(issues):
    ''' Log warning and error messages for a dictionary containing warnings and error messages.

    Args:
        issues (dict(error=[], warning=[])) : A dictionary of all warning and error messages

    Returns:
        None

    This function will emit log warning and error messages for all error or
    warning conditions in the dictionary. For example, a dictionary
    containing a warning for empty layout will trigger a warning:

    .. code-block:: python

        >>> process_validation_issues(validations)
        W-1002 (EMPTY_LAYOUT): Layout has no children: Row(id='2404a029-c69b-4e30-9b7d-4b7b6cdaad5b', ...)

    '''
    errors = issues['error']
    warnings = [item for item in issues['warning'] if not is_silenced(item)]

    warning_messages = []
    for code, name, desc, obj in sorted(warnings):
        msg = f"W-{code} ({name}): {desc}: {obj}"
        warning_messages.append(msg)
        log.warning(msg)

    error_messages = []
    for code, name, desc, obj in sorted(errors):
        msg = f"E-{code} ({name}): {desc}: {obj}"
        error_messages.append(msg)
        log.error(msg)

    if settings.validation_level() == "errors":
        if len(errors):
            raise RuntimeError(f"Errors encountered during validation: {error_messages}")
    elif settings.validation_level() == "all":
        if len(errors) or len(warnings):
            raise RuntimeError(f"Errors encountered during validation: {error_messages+warning_messages}")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
