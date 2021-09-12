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
from typing import Any, Iterator

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
def envset(**kw: Any) -> Iterator[None]:
    ''' Temporarily set environment variables and undo the updates on exit.

    '''
    old = os.environ.copy()
    os.environ.update(**kw)
    yield
    # take care to keept the same actual dict object
    os.environ.clear()
    os.environ.update(old.items())

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
