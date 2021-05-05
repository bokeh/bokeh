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
import os
from subprocess import PIPE, Popen
from sys import executable as python

from . import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

skiplist = {}

def test_python_execution_with_OO() -> None:
    ''' Running python with -OO will discard docstrings (__doc__ is None)
    which can cause problems if docstrings are naively formatted.

    This test ensures that the all modules are importable, even with -OO set.

    If you encounter a new problem with docstrings being formatted, try
    using format_docstring.
    '''
    os.chdir(TOP_PATH)

    imports = []
    for path, _, files in os.walk("bokeh"):
        if "tests" in path:
            continue

        for file in files:
            if not file.endswith(".py"):
                continue
            if file.endswith("__main__.py"):
                continue

            if file.endswith("__init__.py"):
                mod = path.replace(os.sep, ".")
            else:
                mod = path.replace(os.sep, ".") + "." + file[:-3]

            if mod in skiplist:
                continue

            imports.append("import " + mod)

    env = os.environ.copy()
    env['BOKEH_DOCS_MISSING_API_KEY_OK'] = 'yes'

    proc = Popen([python, "-OO", "-"], stdout=PIPE, stdin=PIPE, env=env)
    proc.communicate("\n".join(imports).encode("utf-8"))
    proc.wait()

    assert proc.returncode == 0, "Execution with -OO failed"
