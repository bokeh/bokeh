#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc. All rights reserved.
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
from bokeh._testing.util.project import TOP_PATH, ls_files

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_flake8_bokeh() -> None:
    flake8("bokeh")

def test_flake8_examples() -> None:
    flake8("examples")

def test_flake8_release() -> None:
    flake8("release")

def test_flake8_sphinx() -> None:
    flake8("sphinx")

def test_flake8_tests() -> None:
    flake8("tests")

def test_flake8_typings() -> None:
    flake8("typings")

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------

def flake8(dir: str) -> None:
    ''' Assures that the Python codebase passes configured Flake8 checks.

    '''
    chdir(TOP_PATH)
    proc = run(["flake8", *ls_files(f"{dir}/**.py", f"{dir}/**.pyi")], capture_output=True)
    assert proc.returncode == 0, f"Flake8 issues:\n{proc.stdout.decode('utf-8')}"
