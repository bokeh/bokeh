#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# Standard library imports
import warnings

# Bokeh imports
from bokeh.models import Canvas, DataCube, Plot
from bokeh.util.warnings import BokehDeprecationWarning

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.mark.parametrize("model", [Canvas, Plot])
def test_hidpi_default_does_not_warn(model) -> None:
    with warnings.catch_warnings():
        warnings.simplefilter("error", BokehDeprecationWarning)
        model()

@pytest.mark.parametrize("model", [Canvas, Plot])
def test_hidpi_constructor_warns(model) -> None:
    with pytest.warns(BokehDeprecationWarning, match=rf"{model.__name__}\.hidpi is deprecated"):
        model(hidpi=False)

@pytest.mark.parametrize("model", [Canvas, Plot])
def test_hidpi_assignment_warns(model) -> None:
    obj = model()

    with pytest.warns(BokehDeprecationWarning, match=rf"{model.__name__}\.hidpi is deprecated"):
        obj.hidpi = False

def test_data_cube_deprecated() -> None:
    with pytest.warns(BokehDeprecationWarning, match="DataCube is deprecated and will be removed in Bokeh 4.0"):
        DataCube()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
