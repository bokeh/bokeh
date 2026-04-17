#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Codebase-specific pytest configuration.

The ``tests/codebase/`` suite consists of static code-quality checks (ruff,
isort, eslint, license headers, etc.) that do not exercise Bokeh server or
browser functionality.

Two plugins in the test environment both define a ``base_url`` fixture
with incompatible scopes:

* ``pytest-base-url`` ships a session-scoped ``_verify_url`` autouse
  fixture that depends on ``base_url``.
* ``pytest-tornado5`` defines ``base_url`` as function-scoped (it depends
  on ``http_port``).

When ``_verify_url`` tries to resolve ``base_url`` at session scope,
pytest finds the function-scoped tornado5 definition and raises
``ScopeMismatch`` at setup for every test collected here.

Overriding ``base_url`` locally as a session-scoped no-op short-circuits
the resolution and lets the static checks run. The override only applies
to the ``tests/codebase/`` suite; other test directories are unaffected.
'''
from __future__ import annotations

# External imports
import pytest


@pytest.fixture(scope="session")
def base_url() -> None:
    ''' Session-scoped no-op override of the ``pytest-base-url`` fixture.

    See the module docstring for the full rationale. Returning ``None``
    is fine: ``pytest-base-url``'s ``_verify_url`` short-circuits when the
    URL is falsy, and no codebase test actually consumes this fixture.
    '''
    return None
