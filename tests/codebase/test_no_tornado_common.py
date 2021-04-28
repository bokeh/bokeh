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
# Tests
#-----------------------------------------------------------------------------

modules = [
    "bokeh.client",
    "bokeh.embed",
    "bokeh.io",
    "bokeh.models",
    "bokeh.plotting",
]

def test_no_tornado_common() -> None:
    ''' Basic usage of Bokeh should not result in any Tornado code being
    imported. This test ensures that importing basic modules does not bring in
    Tornado.

    '''
    proc = run([python, "-c", verify_clean_imports('tornado', modules)])
    assert proc.returncode == 0, "Tornado imported in common modules"
