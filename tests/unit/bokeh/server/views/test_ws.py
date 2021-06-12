#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
import logging

# External imports
from tornado.websocket import WebSocketClosedError

# Bokeh imports
from bokeh.server.views.auth_mixin import AuthMixin
from bokeh.util.logconfig import basicConfig

# Module under test
from bokeh.server.views.ws import WSHandler # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

async def test_send_message_raises(caplog: pytest.LogCaptureFixture) -> None:
    class ExcMessage:
        def send(self, handler):
            raise WebSocketClosedError()
    assert len(caplog.records) == 0
    with caplog.at_level(logging.WARN):
        # fake self not great but much easier than setting up a real view
        ret = await WSHandler.send_message("self", ExcMessage())
        assert len(caplog.records) == 1
        assert caplog.text.endswith("Failed sending message as connection was closed\n")
        assert ret is None

def test_uses_auth_mixin() -> None:
    assert issubclass(WSHandler, AuthMixin)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
