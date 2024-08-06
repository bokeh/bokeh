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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
