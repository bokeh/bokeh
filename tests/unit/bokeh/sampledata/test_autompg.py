#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh._testing.util.api import verify_all

# Module under test
#import bokeh.sampledata.autompg as bsa # isort:skip

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
def test_autompg(pd) -> None:
    import bokeh.sampledata.autompg as bsa
    assert isinstance(bsa.autompg, pd.DataFrame)

    # check detail for package data
    assert len(bsa.autompg) == 392
    assert all(x in [1,2,3] for x in bsa.autompg.origin)

@pytest.mark.sampledata
def test_autompg_clean(pd) -> None:
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

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
