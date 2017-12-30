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
#import bokeh.sampledata.autompg as bsa

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'autompg',
    'autompg_clean',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = pytest.mark.sampledata(verify_all("bokeh.sampledata.autompg", ALL))

@pytest.mark.sampledata
def test_autompg():
    import bokeh.sampledata.autompg as bsa
    assert isinstance(bsa.autompg, pd.DataFrame)

    # check detail for package data
    assert len(bsa.autompg) == 392
    assert all(x in [1,2,3] for x in bsa.autompg.origin)

@pytest.mark.sampledata
def test_autompg_clean():
    import bokeh.sampledata.autompg as bsa
    assert isinstance(bsa.autompg_clean, pd.DataFrame)

    # check detail for package data
    assert len(bsa.autompg_clean) == 392
    assert all(x in ['North America', 'Europe', 'Asia'] for x in bsa.autompg_clean.origin)
    for x in ['chevy', 'chevroelt', 'maxda', 'mercedes-benz', 'toyouta', 'vokswagen', 'vw']:
        assert x not in bsa.autompg_clean.mfr

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
