#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide functions for manipulating environment variables in tests.

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
import os
from contextlib import contextmanager
from typing import (
    Any,
    Dict,
    Iterator,
    Tuple,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'envset',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@contextmanager
def envset(value: Tuple[str, Any]|Dict[str, Any]|None=None, **kw: Any) -> Iterator[None]:
    ''' Temporarily set environment variables and undo the updates on exit.

    '''
    old = os.environ.copy()
    if value:
        os.environ.update(value)
    os.environ.update(**kw)
    yield
    # take care to keept the same actual dict object
    os.environ.clear()
    os.environ.update(old)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
