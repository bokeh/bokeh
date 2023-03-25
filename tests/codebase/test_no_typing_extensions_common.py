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

# There should not be unprotected typing_extensions imports /anywhere/
TYPING_EXTENIONS = ()

MODULES = ls_modules(skip_prefixes=TYPING_EXTENIONS)

# This test takes a long time to run, but if the combined test fails then
# uncommenting it will locate exactly what module(s) are the problem
# @pytest.mark.parametrize('module', MODULES)
# def test_no_typing_extensions_common_individual(module) -> None:
#     proc = run([python, "-c", verify_clean_imports('typing_extensions', [module])])
#     assert proc.returncode == 0, f"typing_extensions imported in common module {module}"

def test_no_typing_extensions_common_combined() -> None:
    ''' Basic usage of Bokeh should not result in typing_extensions being
    imported. This test ensures that importing basic modules does not bring in
    typing_extensions.

    '''
    proc = run([python, "-c", verify_clean_imports('typing_extensions', MODULES)])
    assert proc.returncode == 0, "typing_extensions imported in common modules"
