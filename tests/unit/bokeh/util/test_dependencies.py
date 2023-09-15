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
import numpy as np
import pandas as pd

# Module under test
import bokeh.util.dependencies as dep # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_import_optional:
    def test_success(self) -> None:
        assert dep.import_optional('sys') is not None

    def test_fail(self) -> None:
        assert dep.import_optional('bleepbloop') is None


class Test_import_required:
    def test_success(self) -> None:
        assert dep.import_required('sys', 'yep') is not None

    def test_fail(self) -> None:
        with pytest.raises(RuntimeError) as excinfo:
            dep.import_required('bleepbloop', 'nope')
        assert 'nope' in str(excinfo.value)

def test_uses_pandas() -> None:
    assert dep.uses_pandas(1) is False
    assert dep.uses_pandas([]) is False
    assert dep.uses_pandas(np.sqrt(3)) is False
    assert dep.uses_pandas(np.array([1, 2, 3])) is False
    assert dep.uses_pandas(pd.Series([1, 2, 3])) is True
    assert dep.uses_pandas(pd.DataFrame({"x": [1, 2, 3]})) is True

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
