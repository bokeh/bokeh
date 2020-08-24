#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from tornado.ioloop import IOLoop

# Bokeh imports
from bokeh.client.states import NOT_YET_CONNECTED

# Module under test
import bokeh.client.connection as bcc # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class FakeSess:
    id = "session_id"

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test_ClientConnection:
    def test_creation(self) -> None:
        c = bcc.ClientConnection("session", "wsurl")
        assert c.url == "wsurl"
        assert c.connected == False
        assert isinstance(c.io_loop, IOLoop)

        assert c._session == "session"
        assert isinstance(c._state, NOT_YET_CONNECTED)
        assert c._until_predicate is None
        assert c._server_info is None
        assert c._arguments is None

    def test_creation_with_arguments(self) -> None:
        c = bcc.ClientConnection("session", "wsurl", arguments=dict(foo="bar"))
        assert c.url == "wsurl"
        assert c.connected == False
        assert isinstance(c.io_loop, IOLoop)

        assert c._session == "session"
        assert isinstance(c._state, NOT_YET_CONNECTED)
        assert c._until_predicate is None
        assert c._server_info is None
        assert c._arguments == dict(foo="bar")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
