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
from os import chdir
from os.path import join
from subprocess import run

from . import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_license_set() -> None:
    ''' Ensure the top-level repo LICENSES.txt always matches the copy in
    the Python package folder (needed there when generating packages).

    '''
    chdir(TOP_PATH)
    proc = run(["diff", "LICENSE.txt", join("bokeh", "LICENSE.txt")], capture_output=True)
    assert proc.returncode == 0, f"LICENSE.txt mismatch:\n{proc.stdout.decode('utf-8')}"
