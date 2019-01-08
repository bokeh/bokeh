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
#import bokeh.sampledata.sprint as bss

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'sprint',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = pytest.mark.sampledata(verify_all("bokeh.sampledata.sprint", ALL))

@pytest.mark.sampledata
def test_sprint(pd):
    import bokeh.sampledata.sprint as bss
    assert isinstance(bss.sprint, pd.DataFrame)

    # check detail for package data
    assert len(bss.sprint) == 85

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
