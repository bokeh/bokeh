#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
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
from os import chdir
from subprocess import run

# Bokeh imports
from . import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

PATHS = [
    "release",
    "bokeh/sphinxext"
]

def test_black() -> None:
    ''' Assures that the Python codebase imports are correctly formatted.

    '''
    chdir(TOP_PATH)
    proc = run(["black", "-l", "165", "--diff", "--check"] + PATHS, capture_output=True)
    assert proc.returncode == 0, f"black issues:\n{proc.stdout.decode('utf-8')}"

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------
