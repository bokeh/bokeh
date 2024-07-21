#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a Pytest plugin for a Bokeh-specific testing tools.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING

# External imports
import pytest

if TYPE_CHECKING:
    from tests.support.plugins.file_server import SimpleWebServer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
    "tests.support.plugins.file_server",
)

__all__ = (
    'test_file_path_and_url',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.fixture
def test_file_path_and_url(request: pytest.FixtureRequest, file_server: SimpleWebServer) -> tuple[str, str]:
    file_name = request.function.__name__ + '.html'
    file_path = request.node.path.with_name(file_name)

    def tear_down() -> None:
        if file_path.is_file():
            file_path.unlink()
    request.addfinalizer(tear_down)

    return file_path, file_server.where_is(file_path)
