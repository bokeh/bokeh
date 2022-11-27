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
import os
import inspect
import warnings  # lgtm [py/import-and-import-from]
from typing import TYPE_CHECKING, Tuple, overload

# Bokeh imports
from .warnings import BokehDeprecationWarning

if TYPE_CHECKING:
    from typing_extensions import TypeAlias

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'deprecated',
    'warn',
)

Version: TypeAlias = Tuple[int, int, int]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def warn(message: str, stacklevel: int | None = None) -> None:
    if stacklevel is None:
        stacklevel = find_stack_level()

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

def find_stack_level() -> int:
    """
    Find the first place in the stack that is not inside Bokeh.

    Inspired by: pandas.util._exceptions.find_stack_level
    """

    import bokeh

    pkg_dir = os.path.dirname(bokeh.__file__)

    # https://stackoverflow.com/questions/17407119/python-inspect-stack-is-slow
    frame = inspect.currentframe()
    n = 0
    while frame:
        fname = inspect.getfile(frame)
        if fname.startswith(pkg_dir):
            frame = frame.f_back
            n += 1
        else:
            break
    return n

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
