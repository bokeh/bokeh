#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import warnings
from typing import Union, Tuple, Optional, overload

# External imports

# Bokeh imports
from .warnings import BokehDeprecationWarning

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'deprecated',
    'warn',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def warn(message: str, stacklevel: int = 2) -> None:
    warnings.warn(message, BokehDeprecationWarning, stacklevel=stacklevel)

@overload
def deprecated(since_or_msg: Tuple[int, int, int], old: str, new: str, extra: str) -> None:
    ...

@overload
def deprecated(since_or_msg: str) -> None:
    ...

def deprecated(since_or_msg: Union[Tuple[int, int, int], str], old: Optional[str] = None , new: Optional[str] = None, extra: Optional[str] = None) -> None:
    """ Issue a nicely formatted deprecation warning. """

    if isinstance(since_or_msg, tuple):
        if old is None or new is None:
            raise ValueError("deprecated entity and a replacement are required")

        if len(since_or_msg) != 3 or not all(isinstance(x, int) and x >=0 for x in since_or_msg):
            raise ValueError("invalid version tuple: %r" % (since_or_msg,))

        since = "%d.%d.%d" % since_or_msg
        message = "%(old)s was deprecated in Bokeh %(since)s and will be removed, use %(new)s instead."
        message = message % dict(old=old, since=since, new=new)
        if extra is not None:
            message += " " + extra.strip()
    elif isinstance(since_or_msg, str):
        if not (old is None and new is None and extra is None):
            raise ValueError("deprecated(message) signature doesn't allow extra arguments")

        message = since_or_msg
    else:
        raise ValueError("expected a version tuple or string message")

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
