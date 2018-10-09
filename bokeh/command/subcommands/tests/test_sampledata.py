#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.command.bootstrap import main

# Module under test
import bokeh.command.subcommands.sampledata as scsample

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

def test_create():
    import argparse
    from bokeh.command.subcommand import Subcommand

    obj = scsample.Sampledata(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name():
    assert scsample.Sampledata.name == "sampledata"

def test_help():
    assert scsample.Sampledata.help == "Download the bokeh sample data sets"

def test_args():
    assert scsample.Sampledata.args == (
    )

def test_run(capsys):
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
