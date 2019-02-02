#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from mock import patch

# External imports
from six import string_types

# Bokeh imports

# Module under test
import bokeh.client.session as bcs

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_DEFAULT_SESSION_ID():
    assert bcs.DEFAULT_SESSION_ID == "default"

def test_DEFAULT_SERVER_WEBSOCKET_URL():
    assert bcs.DEFAULT_SERVER_WEBSOCKET_URL == "ws://localhost:5006/ws"

class Test_ClientSession(object):

    def test_creation_defaults(self):
        s = bcs.ClientSession()
        assert s.connected == False
        assert s.document is None
        assert s._connection._arguments is None
        assert isinstance(s.id, string_types)
        assert len(s.id) == 44

    def test_creation_with_session_id(self):
        s = bcs.ClientSession("sid")
        assert s.connected == False
        assert s.document is None
        assert s._connection._arguments is None
        assert s.id == "sid"

    def test_creation_with_ws_url(self):
        s = bcs.ClientSession(websocket_url="wsurl")
        assert s.connected == False
        assert s.document is None
        assert s._connection._arguments is None
        assert s._connection.url == "wsurl"
        assert isinstance(s.id, string_types)
        assert len(s.id) == 44

    def test_creation_with_ioloop(self):
        s = bcs.ClientSession(io_loop="io_loop")
        assert s.connected == False
        assert s.document is None
        assert s._connection._arguments is None
        assert s._connection.io_loop == "io_loop"
        assert isinstance(s.id, string_types)
        assert len(s.id) == 44

    def test_creation_with_arguments(self):
        s = bcs.ClientSession(arguments="args")
        assert s.connected == False
        assert s.document is None
        assert s._connection._arguments == "args"
        assert len(s.id) == 44

    @patch("bokeh.client.connection.ClientConnection.connect")
    def test_connect(self, mock_connect):
        s = bcs.ClientSession()
        s.connect()
        assert mock_connect.call_count == 1
        assert mock_connect.call_args[0] == ()
        assert mock_connect.call_args[1] == {}

    @patch("bokeh.client.connection.ClientConnection.close")
    def test_close(self, mock_close):
        s = bcs.ClientSession()
        s.close()
        assert mock_close.call_count == 1
        assert mock_close.call_args[0] == ("closed",)
        assert mock_close.call_args[1] == {}

    @patch("bokeh.client.connection.ClientConnection.close")
    def test_context_manager(self, mock_close):
        with bcs.ClientSession() as session:
            assert isinstance(session, bcs.ClientSession)
        assert mock_close.call_count == 1
        assert mock_close.call_args[0] == ("closed",)
        assert mock_close.call_args[1] == {}

    @patch("bokeh.client.connection.ClientConnection.close")
    def test_close_with_why(self, mock_close):
        s = bcs.ClientSession()
        s.close("foo")
        assert mock_close.call_count == 1
        assert mock_close.call_args[0] == ("foo",)
        assert mock_close.call_args[1] == {}

    @patch("bokeh.client.connection.ClientConnection.force_roundtrip")
    def test_force_roundtrip(self, mock_force_roundtrip):
        s = bcs.ClientSession()
        s.force_roundtrip()
        assert mock_force_roundtrip.call_count == 1
        assert mock_force_roundtrip.call_args[0] == ()
        assert mock_force_roundtrip.call_args[1] == {}

    @patch("bokeh.client.connection.ClientConnection.request_server_info")
    def test_request_server_info(self, mock_request_server_info):
        s = bcs.ClientSession()
        s.request_server_info()
        assert mock_request_server_info.call_count == 1
        assert mock_request_server_info.call_args[0] == ()
        assert mock_request_server_info.call_args[1] == {}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
