#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from subprocess import run
from sys import executable as python

from . import verify_clean_imports

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

modules = [
    "bokeh.embed",
    "bokeh.io",
    "bokeh.models",
    "bokeh.plotting",
]

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_no_client_common() -> None:
    ''' Basic usage of Bokeh should not result in any client code being
    imported. This test ensures that importing basic modules does not bring in
    bokeh.client.

    '''
    proc = run([python, "-c", verify_clean_imports('bokeh.client', modules)])
    assert proc.returncode == 0, "bokeh.client imported in common modules"

def test_no_server_common() -> None:
    ''' Basic usage of Bokeh should not result in any server code being
    imported. This test ensures that importing basic modules does not bring in
    bokeh.server.

    '''
    proc = run([python, "-c", verify_clean_imports('bokeh.server', modules)])
    assert proc.returncode == 0, "bokeh.server imported in common modules"
