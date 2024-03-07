#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. All rights reserved.
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
from subprocess import run

# Bokeh imports
from tests.support.util.project import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_ruff() -> None:
    chdir(TOP_PATH)
    proc = run(["ruff", "."], capture_output=True)
    assert proc.returncode == 0, f"ruff issues:\n{proc.stdout.decode('utf-8')}"

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------
