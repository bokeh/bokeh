#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
import subprocess
from pathlib import Path

# Bokeh imports
from tests.support.defaults import collect_defaults, output_defaults

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestDefaults:
    def test_defaults(self) -> None:
        baseline = Path(__file__).parent / "baselines" / "defaults.json5"

        defaults = collect_defaults()
        output_defaults(baseline, defaults)

        status, out, _ = diff_baseline(baseline)
        if status != 0:
            print(out)
            assert False, "baseline differs"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def git(*args: str) -> tuple[int, str, str]:
    proc = subprocess.Popen(["git", *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = proc.communicate()
    out = stdout.decode("utf-8", errors="ignore")
    err = stderr.decode("utf-8", errors="ignore")
    return (proc.returncode, out, err)

def diff_baseline(baseline_path: Path, ref: str = "HEAD") -> tuple[int, str, str]:
    return git("diff", "--color", "--exit-code", ref, "--", str(baseline_path))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
