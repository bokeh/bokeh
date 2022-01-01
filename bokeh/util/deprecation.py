#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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
import warnings  # lgtm [py/import-and-import-from]
from typing import Tuple, overload

# Bokeh imports
from .warnings import BokehDeprecationWarning

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'deprecated',
    'warn',
)

Version = Tuple[int, int, int]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def warn(message: str, stacklevel: int = 2) -> None:
    warnings.warn(message, BokehDeprecationWarning, stacklevel=stacklevel)

@overload
def deprecated(since_or_msg: Version, old: str, new: str, extra: str | None = None) -> None:
    ...

@overload
def deprecated(since_or_msg: str) -> None:
    ...

def deprecated(since_or_msg: Version | str,
        old: str | None = None, new: str | None = None, extra: str | None = None) -> None:
    """ Issue a nicely formatted deprecation warning. """

    if isinstance(since_or_msg, tuple):
        if old is None or new is None:
            raise ValueError("deprecated entity and a replacement are required")

        if len(since_or_msg) != 3 or not all(isinstance(x, int) and x >= 0 for x in since_or_msg):
            raise ValueError(f"invalid version tuple: {since_or_msg!r}")

        major, minor, patch = since_or_msg
        since = f"{major}.{minor}.{patch}"
        message = f"{old} was deprecated in Bokeh {since} and will be removed, use {new} instead."
        if extra is not None:
            message += " " + extra.strip()
    else:
        if not (old is None and new is None and extra is None):
            raise ValueError("deprecated(message) signature doesn't allow extra arguments")

        message = since_or_msg

    warn(message)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
