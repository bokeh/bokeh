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
from . import TOP_PATH, ls_files

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_flake8() -> None:
    ''' Assures that the Python codebase passes configured Flake8 checks

    '''
    chdir(TOP_PATH)
    proc = run(["flake8", *ls_files("*.py")], capture_output=True)
    assert proc.returncode == 0, f"Flake8 issues:\n{proc.stdout.decode('utf-8')}"

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------
