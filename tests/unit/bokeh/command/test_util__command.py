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

# Standard library imports
import os
import tempfile

# External imports
from mock import MagicMock, patch

# Bokeh imports
from bokeh._testing.util.types import Capture

# Module under test
import bokeh.command.util as util # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_die(capsys: Capture) -> None:
    with pytest.raises(SystemExit):
        util.die("foo")
    out, err = capsys.readouterr()
    assert err == "foo\n"
    assert out == ""

def test_build_single_handler_application_unknown_file() -> None:
    with pytest.raises(ValueError) as e:
        f = tempfile.NamedTemporaryFile(suffix=".bad")
        util.build_single_handler_application(f.name)
    assert "Expected a '.py' script or '.ipynb' notebook, got: " in str(e.value)

def test_build_single_handler_application_nonexistent_file() -> None:
    with pytest.raises(ValueError) as e:
        util.build_single_handler_application("junkjunkjunk")
    assert "Path for Bokeh server application does not exist: " in str(e.value)

DIRSTYLE_MAIN_WARNING_COPY = """
It looks like you might be running the main.py of a directory app directly.
If this is the case, to enable the features of directory style apps, you must
call "bokeh serve" on the directory instead. For example:

    bokeh serve my_app_dir/

If this is not the case, renaming main.py will suppress this warning.
"""

@patch('warnings.warn')
def test_build_single_handler_application_main_py(mock_warn: MagicMock) -> None:
    f = tempfile.NamedTemporaryFile(suffix="main.py", delete=False)
    f.close() #close file to open it later on windows
    util.build_single_handler_application(f.name)
    assert mock_warn.called
    assert mock_warn.call_args[0] == (DIRSTYLE_MAIN_WARNING_COPY,)
    os.remove(f.name)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
