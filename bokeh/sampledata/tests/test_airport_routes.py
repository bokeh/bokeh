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

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
import pandas as pd

# Bokeh imports
from bokeh.util.testing import verify_all

# Module under test
#import bokeh.sampledata.airport_routes as bsa

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'airports',
    'routes',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = pytest.mark.sampledata(verify_all("bokeh.sampledata.airport_routes", ALL))

@pytest.mark.sampledata
def test_airports():
    import bokeh.sampledata.airport_routes as bsa
    assert isinstance(bsa.airports, pd.DataFrame)

    # don't check detail for external data

@pytest.mark.sampledata
def test_routes():
    import bokeh.sampledata.airport_routes as bsa
    assert isinstance(bsa.routes, pd.DataFrame)

    # don't check detail for external data

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
