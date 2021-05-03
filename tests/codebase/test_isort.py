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
from subprocess import run

from . import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_isort_bokeh() -> None:
    isort("bokeh")

def test_isort_examples() -> None:
    isort("examples")

def test_isort_release() -> None:
    isort("release")

def test_isort_sphinx() -> None:
    isort("sphinx")

def test_isort_tests() -> None:
    isort("tests")

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------

def isort(dir: str) -> None:
    ''' Assures that the Python codebase imports are correctly sorted.

    '''
    chdir(TOP_PATH)
    proc = run(["isort", "--diff", "-c", dir], capture_output=True)
    assert proc.returncode == 0, f"isort issues:\n{proc.stdout.decode('utf-8')}"
