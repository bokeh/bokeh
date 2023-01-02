#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

# External imports
import pandas as pd

# Bokeh imports
from tests.support.util.api import verify_all

# Module under test
#import bokeh.sampledata.periodic_table as bsp # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'elements',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = pytest.mark.sampledata(verify_all("bokeh.sampledata.periodic_table", ALL))

@pytest.mark.sampledata
def test_elements() -> None:
    import bokeh.sampledata.periodic_table as bsp
    assert isinstance(bsp.elements, pd.DataFrame)

    # check detail for package data
    assert len(bsp.elements) == 118

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
