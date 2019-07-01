#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
from subprocess import PIPE, Popen

# External imports

# Bokeh imports
from . import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

@pytest.mark.codebase
def test_python_execution_with_OO():
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

            imports.append("import " + mod)

    test_env = os.environ.copy()
    test_env['BOKEH_DOCS_MISSING_API_KEY_OK'] = 'yes'

    proc = Popen(["python", "-OO", "-"], stdout=PIPE, stdin=PIPE, env=test_env)
    proc.communicate("\n".join(imports).encode("utf-8"))
    proc.wait()

    if proc.returncode != 0:
        assert False
