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
from os.path import join

# Bokeh imports
from bokeh.command.bootstrap import main
from bokeh.command.subcommand import Argument
from tests.support.util.types import Capture

# Module under test
import bokeh.command.subcommands.info as scinfo # isort:skip

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

    obj = scinfo.Info(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name() -> None:
    assert scinfo.Info.name == "info"

def test_help() -> None:
    assert scinfo.Info.help == "Print information about Bokeh and Bokeh server configuration"

def test_args() -> None:
    assert scinfo.Info.args == (
        ('--static', Argument(
            action='store_true',
            help="Print the locations of BokehJS static files",
        )),
    )

def test_run(capsys: Capture) -> None:
    main(["bokeh", "info"])
    out, err = capsys.readouterr()
    lines = out.split("\n")
    # Check that we have at least the basic info lines (may have more due to non-default settings)
    assert len(lines) >= 11
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
    # May have additional lines for non-default settings section
    assert err == ""

def test_run_static(capsys: Capture) -> None:
    main(["bokeh", "info", "--static"])
    out, err = capsys.readouterr()
    assert err == ""
    assert out.endswith(join('bokeh', 'server', 'static') + '\n')

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
