#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide Bokeh-specific warning subclasses.

The primary use of these subclasses to to force them to be unconditionally
displayed to users by default.

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
import inspect
import os
import warnings  # lgtm [py/import-and-import-from]

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'BokehDeprecationWarning',
    'BokehUserWarning',
    'find_stack_level',
    'warn',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class BokehDeprecationWarning(DeprecationWarning):
    ''' A Bokeh-specific ``DeprecationWarning`` subclass.

    Used to selectively filter Bokeh deprecations for unconditional display.

    '''

class BokehUserWarning(UserWarning):
    ''' A Bokeh-specific ``UserWarning`` subclass.

    Used to selectively filter Bokeh warnings for unconditional display.

    '''

def warn(message: str, category: type[Warning] | None = None, stacklevel: int | None = None) -> None:
    if stacklevel is None:
        stacklevel = find_stack_level()

    warnings.warn(message, category, stacklevel=stacklevel)

def find_stack_level() -> int:
    """Find the first place in the stack that is not inside Bokeh.

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
