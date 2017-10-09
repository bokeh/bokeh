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
import bokeh.sampledata.daylight as bsd

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'daylight_warsaw_2013',
)

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bsd, ALL)

@pytest.mark.sampledata
def test_daylight_warsaw_2013():
    assert isinstance(bsd.daylight_warsaw_2013, pd.DataFrame)

    # check detail for package data
    assert len(bsd.daylight_warsaw_2013) == 365

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
