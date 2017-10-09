#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

from bokeh.util.api import INTERNAL, PUBLIC ; INTERNAL, PUBLIC
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.util.testing import verify_all

# Module under test
import bokeh.sampledata.stocks as bss

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'AAPL',
    'FB',
    'GOOG',
    'IBM',
    'MSFT',
)

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bss, ALL)

@pytest.mark.parametrize('name', ['AAPL', 'FB', 'GOOG', 'IBM', 'MSFT'])
@pytest.mark.sampledata
def test_data(name):
    data = getattr(bss, name)
    assert isinstance(data, dict)

    # don't check detail for external data

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
