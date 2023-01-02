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

# Standard library imports
from unittest.mock import call, patch

# Module under test
import bokeh.util.sampledata as bus # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.mark.sampledata
def test_external_path_bad() -> None:
    pat = "Could not locate external data file (.*)junkjunk. Please execute bokeh.sampledata.download()"
    with pytest.raises(RuntimeError, match=pat):
        bus.external_path("junkjunk")

@pytest.mark.sampledata
def test_package_dir() -> None:
    path = bus.package_dir()
    assert path.exists()
    assert path.parts[-2:] == ("sampledata", "_data")

@pytest.mark.sampledata
def test_package_csv() -> None:
    with patch('pandas.read_csv') as mock_read_csv:
        bus.package_csv("module", "foo", bar=10)
    assert mock_read_csv.has_call(call(bus.package_path("foo"), bar=10))

@pytest.mark.sampledata
def test_package_path() -> None:
    assert bus.package_path("foo") == bus.package_dir() /"foo"

@pytest.mark.sampledata
def test_open_csv() -> None:
    with patch('builtins.open') as mock_open:
        bus.open_csv("foo")
    assert mock_open.has_call(call("foo", "r", newline="", encoding="utf8"))
