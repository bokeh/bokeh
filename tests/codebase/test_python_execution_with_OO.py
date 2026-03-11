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
from subprocess import PIPE, Popen
from sys import executable as python

# Bokeh imports
from bokeh.util.dependencies import is_installed
from tests.support.util.project import ls_modules

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

SKIP: list[str] = []

# Raises ImportError if not installed
if not is_installed("selenium"):
    SKIP.append("bokeh.io.webdriver")
if not is_installed("bokeh_sampledata"):
    SKIP.append("bokeh.sampledata")
if not is_installed("sphinx"):
    SKIP.append("bokeh.sphinxext")

def test_python_execution_with_OO() -> None:
    ''' Running python with -OO will discard docstrings (__doc__ is None)
    which can cause problems if docstrings are naively formatted.

    This test ensures that all modules are importable, even with -OO set.

    If you encounter a new problem with docstrings being formatted, try
    using format_docstring.
    '''
    imports = [f"import {mod}" for mod in ls_modules(skip_prefixes=SKIP)]

    proc = Popen([python, "-OO", "-"], stdout=PIPE, stdin=PIPE)
    proc.communicate("\n".join(imports).encode("utf-8"))
    proc.wait()

    assert proc.returncode == 0, "Execution with -OO failed"
