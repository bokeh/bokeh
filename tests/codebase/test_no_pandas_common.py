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
from subprocess import run
from sys import executable as python

# Bokeh imports
from tests.support.util.project import ls_modules, verify_clean_imports

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

# There should not be unprotected pandas imports /anywhere/
PANDAS_ALLOWED = (
    "bokeh.sampledata",
    "bokeh.sphinxext",
    "tests.support",
)

MODULES = ls_modules(skip_prefixes=PANDAS_ALLOWED)

# This test takes a long time to run, but if the combined test fails then
# uncommenting it will locate exactly what module(s) are the problem
# @pytest.mark.parametrize('module', MODULES)
# def test_no_pandas_common_individual(module) -> None:
#     proc = run([python, "-c", verify_clean_imports('pandas', [module])])
#     assert proc.returncode == 0, f"pandas imported in common module {module}"

def test_no_pandas_common_combined() -> None:
    ''' In order to keep the initial import times reasonable,  import
    of Bokeh should not result in any Pandas code being imported. This
    test ensures that importing basic modules does not bring in pandas.

    '''
    proc = run([python, "-c", verify_clean_imports("pandas", MODULES)], capture_output=True)
    output = proc.stdout.decode("utf-8").strip()
    assert proc.returncode == 0, f"pandas imported in common modules: {output}"
