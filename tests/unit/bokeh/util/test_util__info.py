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
from typing import Any

# Bokeh imports
from tests.support.util.env import envset
from tests.support.util.types import Capture

# Module under test
import bokeh.util.info as bui # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_print_info(capsys: Capture) -> None:
    bui.print_info()
    out, err = capsys.readouterr()
    lines = out.split("\n")
    assert len(lines) == 11
    assert lines[0].startswith("Python version")
    assert lines[1].startswith("IPython version")
    assert lines[2].startswith("Tornado version")
    assert lines[3].startswith("NumPy version")
    assert lines[4].startswith("Bokeh version")
    assert lines[5].startswith("BokehJS static")
    assert lines[6].startswith("node.js version")
    assert lines[7].startswith("npm version")
    assert lines[8].startswith("jupyter_bokeh version")
    assert lines[9].startswith("Operating system")
    assert lines[10] == ""
    assert err == ""

def test__version_missing(ipython: Any) -> None:
    assert bui._version('bokeh', '__version__') is not None
    assert bui._version('IPython', '__version__') is not None
    assert bui._version('tornado', 'version') is not None
    assert bui._version('junk', 'whatever') is None

def test_print_non_default_settings(capsys: Capture) -> None:
    with envset(BOKEH_LOG_LEVEL="debug", BOKEH_MINIFIED="no", BOKEH_DEFAULT_SERVER_PORT="6000"):
        bui.print_non_default_settings()
        out, err = capsys.readouterr()
        assert err == ""
        assert "Non-default Bokeh Settings:" in out
        assert "Setting" in out and "Default" in out and "Value" in out
        assert "log_level" in out and "info" in out and "debug" in out
        assert "minified" in out and "True" in out and "False" in out
        assert "default_server_port" in out and "5006" in out and "6000" in out

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
