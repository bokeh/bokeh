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

from bokeh.util.api import DEV, GENERAL ; DEV, GENERAL
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
#import bokeh.sampledata.sea_surface_temperature as bss

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'sea_surface_temperature',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = pytest.mark.sampledata(verify_all("bokeh.sampledata.sea_surface_temperature", ALL))

@pytest.mark.sampledata
def test_sea_surface_temperature():
    import bokeh.sampledata.sea_surface_temperature as bss
    assert isinstance(bss.sea_surface_temperature, pd.DataFrame)

    # check detail for package data
    assert len(bss.sea_surface_temperature) == 19226

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
