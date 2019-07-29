#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a Pytest plugin for handling tests when Pandas may be missing.

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
def ipython():
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
