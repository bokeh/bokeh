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
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os import chdir
from os.path import join
from subprocess import run
import sys

from . import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

@pytest.mark.skipif(sys.platform == "win32", reason="skip license tests on Windows")
def test_license_set() -> None:
    ''' Ensure the top-level repo LICENSES.txt always matches the copy in
    the Python package folder (needed there when generating packages).

    '''
    chdir(TOP_PATH)
    # Explicitly call git for Windows users
    proc = run(["git", "diff", "LICENSE.txt", join("bokeh", "LICENSE.txt")], capture_output=True)
    diff = proc.stdout.decode('utf-8')
    assert diff == '', f"LICENSE.txt mismatch:\n{diff}"
