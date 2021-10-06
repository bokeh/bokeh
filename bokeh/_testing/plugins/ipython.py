#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a Pytest plugin for handling tests when Pandas may be missing.

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
from types import ModuleType

# External imports
import pytest

# Bokeh imports
from bokeh.util.dependencies import import_optional

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ipython',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.fixture
def ipython() -> ModuleType | None: # XXX: should be IPython | None, but not supported
    ''' A PyTest fixture that will automatically skip a test if IPython is
    not installed.

    '''
    ipython = import_optional('IPython')
    if ipython is None:
        pytest.skip('IPython is not installed')
    return ipython

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
