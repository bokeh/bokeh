#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Codebase-specific pytest configuration.

The ``tests/codebase/`` suite consists of static code-quality checks (ruff,
isort, eslint, license headers, etc.) that do not exercise Bokeh server or
browser functionality. They do not need the ``pytest-base-url`` plugin,
whose session-scoped ``_verify_url`` fixture clashes with the
function-scoped ``base_url`` fixture provided by ``pytest-tornado5`` and
produces a ``ScopeMismatch`` at setup for every test in this directory.

Blocking the plugin here -- rather than removing it from the test
environment -- keeps the fix narrowly scoped to this suite.
'''
from __future__ import annotations


def pytest_configure(config):
    config.pluginmanager.set_blocked("base_url")
