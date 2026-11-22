#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide Bokeh warning utilities. '''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import warnings
from os import sep
from os.path import dirname

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'BOKEH_DEPRECATION_MESSAGE_PATTERN',
    'BokehUserWarning',
    'warn',
    'warn_deprecated',
)

BOKEH_DEPRECATION_MESSAGE_PATTERN = r".* was deprecated in Bokeh "

# Include the separator so sibling directories aren't treated as part of Bokeh.
_BOKEH_WARNING_PREFIXES = (dirname(dirname(__file__)) + sep,)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class BokehUserWarning(UserWarning):
    """A warning category retained for callers that filter Bokeh serializer warnings."""

def warn(message: str, category: type[Warning] | None = None) -> None:
    """Issue a warning attributed to the caller outside Bokeh."""
    warnings.warn(message, category, skip_file_prefixes=_BOKEH_WARNING_PREFIXES)

def warn_deprecated(old: str, new: str, *, since: tuple[int, int, int], extra: str | None = None) -> None:
    """Issue a versioned deprecation warning with a suggested replacement."""
    version = ".".join(map(str, since))
    message = f"{old!r} was deprecated in Bokeh {version} and will be removed, use {new!r} instead."
    if extra is not None:
        message += " " + extra.strip()
    warn(message, DeprecationWarning)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
