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
import pandas as pd

# Bokeh imports
from bokeh.util.testing import verify_all

# Module under test
import bokeh.sampledata.gapminder as bsg

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'fertility',
    'life_expectancy',
    'population',
    'regions',
)

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bsg, ALL)

@pytest.mark.parametrize('name', ['fertility', 'life_expectancy', 'population', 'regions'])
@pytest.mark.sampledata
def test_data(name):
    data = getattr(bsg, name)
    assert isinstance(data, pd.DataFrame)

    # don't check detail for external data

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
