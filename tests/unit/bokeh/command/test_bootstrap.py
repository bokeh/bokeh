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
from bokeh import __version__
from bokeh._testing.util.types import Capture

# Module under test
from bokeh.command.bootstrap import main # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _assert_version_output(capsys: Capture):
    out, err = capsys.readouterr()
    err_expected = ""
    out_expected = ("%s\n" % __version__)
    assert err == err_expected
    assert out == out_expected

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_no_subcommand(capsys: Capture) -> None:
    with pytest.raises(SystemExit):
        main(["bokeh"])
    out, err = capsys.readouterr()
    assert err == "ERROR: Must specify subcommand, one of: build, info, init, json, sampledata, secret, serve or static\n"
    assert out == ""

def test_version(capsys: Capture) -> None:
    with pytest.raises(SystemExit):
        main(["bokeh", "--version"])
    _assert_version_output(capsys)

def test_version_short(capsys: Capture) -> None:
    with pytest.raises(SystemExit):
        main(["bokeh", "-v"])
    _assert_version_output(capsys)

def test_error(capsys: Capture) -> None:
    from bokeh.command.subcommands.info import Info
    old_invoke = Info.invoke
    def err(x, y): raise RuntimeError("foo")
    Info.invoke = err
    with pytest.raises(SystemExit):
        main(["bokeh", "info"])
    out, err = capsys.readouterr()
    assert err == 'ERROR: foo\n'
    Info.invoke = old_invoke

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
