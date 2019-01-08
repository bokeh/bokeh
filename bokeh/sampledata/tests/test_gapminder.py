#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh._testing.util.api import verify_all

# Module under test
#import bokeh.sampledata.gapminder as bsg

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
# General API
#-----------------------------------------------------------------------------

Test___all__ = pytest.mark.sampledata(verify_all("bokeh.sampledata.gapminder", ALL))

@pytest.mark.sampledata
@pytest.mark.parametrize('name', ['fertility', 'life_expectancy', 'population', 'regions'])
def test_data(pd, name):
    import bokeh.sampledata.gapminder as bsg
    data = getattr(bsg, name)
    assert isinstance(data, pd.DataFrame)

    # don't check detail for external data

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
