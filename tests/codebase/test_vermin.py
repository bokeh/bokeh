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
from subprocess import run

# External imports
import tomllib

# Bokeh imports
from tests.support.util.project import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_vermin() -> None:
    pyproject = tomllib.loads((TOP_PATH / "pyproject.toml").read_text(encoding="utf-8"))
    minpy = pyproject["project"]["requires-python"].lstrip(">=")
    cmd = ["vermin", "--processes=4", "--eval-annotations", "--no-tips", f"-t={minpy}", "-vvv", "--lint", "--exclude-regex", "\\.pyi$", "src/bokeh"]
    proc = run(cmd, cwd=TOP_PATH, capture_output=True)
    assert proc.returncode == 0, f"vermin issues:\n{proc.stdout.decode('utf-8')}"

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------
