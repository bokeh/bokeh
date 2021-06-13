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

# External imports
from mock import (
    MagicMock,
    Mock,
    PropertyMock,
    patch,
)

# Module under test
import bokeh.io.util as biu # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_detect_current_filename() -> None:
    filename = biu.detect_current_filename()
    assert filename and filename.endswith(("py.test", "pytest", "py.test-script.py", "pytest-script.py"))

@patch('bokeh.io.util.NamedTemporaryFile')
def test_temp_filename(mock_tmp: MagicMock) -> None:
    fn = Mock()
    type(fn).name = PropertyMock(return_value="Junk.test")
    mock_tmp.return_value = fn

    r = biu.temp_filename("test")
    assert r == "Junk.test"
    assert mock_tmp.called
    assert mock_tmp.call_args[0] == ()
    assert mock_tmp.call_args[1] == {'suffix': '.test'}

def test_default_filename() -> None:
    old_detect_current_filename = biu.detect_current_filename
    old__no_access = biu._no_access
    old__shares_exec_prefix = biu._shares_exec_prefix

    biu.detect_current_filename = lambda: "/a/b/foo.py"

    try:
        # .py extension
        with pytest.raises(RuntimeError):
            biu.default_filename("py")

        def FALSE(_: str) -> bool:
            return False
        def TRUE(_: str) -> bool:
            return True

        # a current file, access, and no share exec
        biu._no_access = FALSE
        r = biu.default_filename("test")
        assert os.path.normpath(r) == os.path.normpath("/a/b/foo.test")

        # a current file, NO access, and no share exec
        biu._no_access = TRUE
        r = biu.default_filename("test")
        assert os.path.normpath(r) != os.path.normpath("/a/b/foo.test")
        assert r.endswith(".test")

        # a current file, access, but WITH share exec
        biu._no_access = FALSE
        biu._shares_exec_prefix = TRUE
        r = biu.default_filename("test")
        assert os.path.normpath(r) != os.path.normpath("/a/b/foo.test")
        assert r.endswith(".test")

        # no current file
        biu.detect_current_filename = lambda: None
        biu._no_access = FALSE
        biu._shares_exec_prefix = FALSE
        r = biu.default_filename("test")
        assert os.path.normpath(r) != os.path.normpath("/a/b/foo.test")
        assert r.endswith(".test")

    finally:
        biu.detect_current_filename = old_detect_current_filename
        biu._no_access = old__no_access
        biu._shares_exec_prefix = old__shares_exec_prefix

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@patch('os.access')
def test__no_access(mock_access: MagicMock) -> None:
    biu._no_access("test")
    assert mock_access.called
    assert mock_access.call_args[0] == ("test", os.W_OK | os.X_OK)
    assert mock_access.call_args[1] == {}

def test__shares_exec_prefix() -> None:
    import sys
    old_ex = sys.exec_prefix
    try:
        sys.exec_prefix = "/foo/bar"
        assert biu._shares_exec_prefix("/foo/bar") == True
        sys.exec_prefix = "/baz/bar"
        assert biu._shares_exec_prefix("/foo/bar") == False
        sys.exec_prefix = None
        assert biu._shares_exec_prefix("/foo/bar") == False
    finally:
        sys.exec_prefix = old_ex

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
