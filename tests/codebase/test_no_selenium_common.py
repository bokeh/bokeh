#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2024, Anaconda, Inc. All rights reserved.
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

SELENIUM_ALLOWED = (
    "tests.support",
    "bokeh.io.webdriver",
)

MODULES = ls_modules(skip_prefixes=SELENIUM_ALLOWED)


# This test takes a long time to run, but if the combined test fails then
# uncommenting it will locate exactly what module(s) are the problem
# @pytest.mark.parametrize('module', MODULES)
# def test_no_selenium_common_individual(module) -> None:
#     proc = run([python, "-c", verify_clean_imports('selenium', [module])])
#     assert proc.returncode == 0, f"Selenium imported in common module {module}"

def test_no_selenium_common_combined() -> None:
    ''' Basic usage of Bokeh should not result in any Selenium code being
    imported. This test ensures that importing basic modules does not bring in
    Tornado.

    '''
    proc = run([python, "-c", verify_clean_imports('selenium', MODULES)])
    assert proc.returncode == 0, "Selenium imported in common modules"
