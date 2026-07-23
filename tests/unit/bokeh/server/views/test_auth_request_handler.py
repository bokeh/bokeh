#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
from unittest.mock import MagicMock

# Module under test
from bokeh.server.views.auth_request_handler import AuthRequestHandler # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def _make_handler(login_url=None, get_login_url=None, prefix=""):
    app = MagicMock()
    app.prefix = prefix
    app.auth_provider.login_url = login_url
    app.auth_provider.get_login_url = get_login_url

    handler = AuthRequestHandler.__new__(AuthRequestHandler)
    handler.application = app
    return handler

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestGetLoginUrl:
    def test_login_url_no_prefix(self) -> None:
        handler = _make_handler(login_url="/login")
        assert handler.get_login_url() == "/login"

    def test_login_url_with_prefix(self) -> None:
        handler = _make_handler(login_url="/login", prefix="/pre")
        assert handler.get_login_url() == "/pre/login"

    def test_login_url_without_leading_slash(self) -> None:
        handler = _make_handler(login_url="login", prefix="/pre")
        assert handler.get_login_url() == "/pre/login"

    def test_login_url_with_trailing_slash(self) -> None:
        handler = _make_handler(login_url="/login/", prefix="/pre")
        assert handler.get_login_url() == "/pre/login/"

    def test_login_url_multi_segment_prefix(self) -> None:
        handler = _make_handler(login_url="/login", prefix="/a/b")
        assert handler.get_login_url() == "/a/b/login"

    def test_get_login_url_func_not_affected_by_prefix(self) -> None:
        handler = _make_handler(get_login_url=lambda req: "/custom_login", prefix="/pre")
        assert handler.get_login_url() == "/custom_login"

    def test_raises_when_no_login_url(self) -> None:
        handler = _make_handler()
        with pytest.raises(RuntimeError):
            handler.get_login_url()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
