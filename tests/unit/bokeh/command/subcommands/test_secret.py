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
import bokeh.command.subcommands.secret as scsecret # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_create() -> None:
    import argparse

    from bokeh.command.subcommand import Subcommand

    obj = scsecret.Secret(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name() -> None:
    assert scsecret.Secret.name == "secret"

def test_help() -> None:
    assert scsecret.Secret.help == "Create a Bokeh secret key for use with Bokeh server"

def test_args() -> None:
    assert scsecret.Secret.args == ()

def test_run(capsys: Capture) -> None:
    main(["bokeh", "secret"])
    out, err = capsys.readouterr()
    assert err == ""
    assert len(out) == 45
    assert out[-1] == '\n'

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
