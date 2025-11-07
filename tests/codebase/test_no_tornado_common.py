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
from subprocess import run
from sys import executable as python

# Bokeh imports
from bokeh.util.dependencies import is_installed
from tests.support.util.project import ls_modules, verify_clean_imports

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

TORNADO_ALLOWED = [
    "tests.support",
    "bokeh.client",
    "bokeh.command",
    "bokeh.io.notebook",
    "bokeh.server",
    "bokeh.util.tornado",
]

# Raises ImportError if not installed
if not is_installed("selenium"):
    TORNADO_ALLOWED.append("bokeh.io.webdriver")
if not is_installed("bokeh_sampledata"):
    TORNADO_ALLOWED.append("bokeh.sampledata")
if not is_installed("sphinx"):
    TORNADO_ALLOWED.append("bokeh.sphinxext")

MODULES = ls_modules(skip_prefixes=TORNADO_ALLOWED)

# This test takes a long time to run, but if the combined test fails then
# uncommenting it will locate exactly what module(s) are the problem
# @pytest.mark.parametrize('module', MODULES)
# def test_no_tornado_common_individual(module) -> None:
#     proc = run([python, "-c", verify_clean_imports('tornado', [module])])
#     assert proc.returncode == 0, f"Tornado imported in common module {module}"

def test_no_tornado_common_combined() -> None:
    ''' Basic usage of Bokeh should not result in any Tornado code being
    imported. This test ensures that importing basic modules does not bring in
    Tornado.

    '''
    proc = run([python, "-c", verify_clean_imports('tornado', MODULES)])
    assert proc.returncode == 0, "Tornado imported in collective common modules"
