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
#import bokeh.sampledata.perceptions as bsp

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'numberly',
    'probly',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = pytest.mark.sampledata(verify_all("bokeh.sampledata.perceptions", ALL))

@pytest.mark.sampledata
def test_numberly():
    import bokeh.sampledata.perceptions as bsp
    assert isinstance(bsp.numberly, pd.DataFrame)

    # check detail for package data
    assert len(bsp.numberly) == 46

@pytest.mark.sampledata
def test_probly():
    import bokeh.sampledata.perceptions as bsp
    assert isinstance(bsp.probly, pd.DataFrame)

    # check detail for package data
    assert len(bsp.probly) == 46

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
