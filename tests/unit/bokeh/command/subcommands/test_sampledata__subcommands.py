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
from bokeh._testing.util.types import Capture
from bokeh.command.bootstrap import main

# Module under test
import bokeh.command.subcommands.sampledata as scsample # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

did_call_download = False

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_create() -> None:
    import argparse

    from bokeh.command.subcommand import Subcommand

    obj = scsample.Sampledata(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name() -> None:
    assert scsample.Sampledata.name == "sampledata"

def test_help() -> None:
    assert scsample.Sampledata.help == "Download the bokeh sample data sets"

def test_args() -> None:
    assert scsample.Sampledata.args == (
    )

def test_run(capsys: Capture) -> None:
    main(["bokeh", "sampledata"])
    assert did_call_download == True

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _mock_download():
    global did_call_download
    did_call_download = True

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

scsample.sampledata.download = _mock_download
