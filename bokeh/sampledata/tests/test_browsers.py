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

# Bokeh imports
from bokeh._testing.util.api import verify_all

# Module under test
#import bokeh.sampledata.browsers as bsb

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'browsers_nov_2013',
    'icons',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = pytest.mark.sampledata(verify_all("bokeh.sampledata.browsers", ALL))

@pytest.mark.sampledata
def test_browsers_nov_2013(pd):
    import bokeh.sampledata.browsers as bsb
    assert isinstance(bsb.browsers_nov_2013, pd.DataFrame)

    # check detail for package data
    assert len(bsb.browsers_nov_2013) == 118

@pytest.mark.sampledata
def test_icons():
    import bokeh.sampledata.browsers as bsb
    assert isinstance(bsb.icons, dict)

    # check detail for package data
    assert set(bsb.icons.keys()).issubset(set(["Chrome", "Firefox", "Safari", "Opera", "IE"]))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
