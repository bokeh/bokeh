#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from mock import call, patch

# Module under test
import bokeh.util.sampledata as bus # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_external_path_bad() -> None:
    pat = f"Could not locate external data file (.*)junkjunk. Please execute bokeh.sampledata.download()"
    with pytest.raises(RuntimeError, match=pat):
        bus.external_path("junkjunk")

def test_package_dir() -> None:
    path = bus.package_dir()
    assert path.exists()
    assert str(path).endswith("sampledata/_data")

def test_package_csv() -> None:
    with patch('pandas.read_csv') as mock_read_csv:
        bus.package_csv("module", "foo", bar=10)
        assert mock_read_csv.call_count == 1
        assert mock_read_csv.call_args[0] == (bus.package_path("foo"),)
        assert mock_read_csv.call_args[1] == dict(bar=10)

def test_package_path() -> None:
    assert bus.package_path("foo") == bus.package_dir() /"foo"

def test_open_csv() -> None:
   with patch('builtins.open') as mock_open:
    bus.open_csv("foo")
    assert mock_open.has_calls(call("foo", "r", newline="", encoding="utf8"))
