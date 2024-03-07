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
from typing import Sequence

# Bokeh imports
from tests.support.util.project import ls_modules

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

SKIP: Sequence[str] = []

def test_python_execution_with_OO() -> None:
    ''' Running python with -OO will discard docstrings (__doc__ is None)
    which can cause problems if docstrings are naively formatted.

    This test ensures that the all modules are importable, even with -OO set.

    If you encounter a new problem with docstrings being formatted, try
    using format_docstring.
    '''
    imports = [f"import {mod}" for mod in ls_modules(skip_prefixes=SKIP)]

    proc = Popen([python, "-OO", "-"], stdout=PIPE, stdin=PIPE)
    proc.communicate("\n".join(imports).encode("utf-8"))
    proc.wait()

    assert proc.returncode == 0, "Execution with -OO failed"
