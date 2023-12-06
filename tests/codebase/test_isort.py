#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc. All rights reserved.
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

def test_isort_bokeh() -> None:
    isort("src/bokeh")

def test_isort_examples() -> None:
    isort("examples")

def test_isort_release() -> None:
    isort("release")

def test_isort_docs_bokeh() -> None:
    isort("docs/bokeh")

def test_isort_tests() -> None:
    isort("tests")

def test_isort_typings() -> None:
    isort("src/typings")

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------

def isort(dir: str) -> None:
    ''' Assures that the Python codebase imports are correctly sorted.

    '''
    chdir(TOP_PATH)
    proc = run(["isort", "--gitignore", "--diff", "-c", dir], capture_output=True)
    assert proc.returncode == 0, f"isort issues:\n{proc.stdout.decode('utf-8')}"
