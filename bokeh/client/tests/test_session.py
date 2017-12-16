#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

from bokeh.util.api import DEV, GENERAL ; DEV, GENERAL
from bokeh.util.testing import verify_api ; verify_api

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
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

        ( 'pull_session',                      (1, 0, 0) ),
        ( 'push_session',                      (1, 0, 0) ),
        ( 'show_session',                      (1, 0, 0) ),
        ( 'ClientSession',                     (1, 0, 0) ),
        ( 'ClientSession.connected.fget',      (1, 0, 0) ),
        ( 'ClientSession.document.fget',       (1, 0, 0) ),
        ( 'ClientSession.id.fget',             (1, 0, 0) ),
        ( 'ClientSession.connect',             (1, 0, 0) ),
        ( 'ClientSession.close',               (1, 0, 0) ),
        ( 'ClientSession.force_roundtrip',     (1, 0, 0) ),
        ( 'ClientSession.loop_until_closed',   (1, 0, 0) ),
        ( 'ClientSession.pull',                (1, 0, 0) ),
        ( 'ClientSession.push',                (1, 0, 0) ),
        ( 'ClientSession.request_server_info', (1, 0, 0) ),
        ( 'ClientSession.show',                (1, 0, 0) ),

    ), DEV: (

    )

}

Test_api = verify_api(bcs, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_module_docstring_warning():
    assert bcs._BOKEH_CLIENT_APP_WARNING_BODY in bcs.__doc__

def test_DEFAULT_SESSION_ID():
    assert bcs.DEFAULT_SESSION_ID == "default"

def test_DEFAULT_SERVER_WEBSOCKET_URL():
    assert bcs.DEFAULT_SERVER_WEBSOCKET_URL == "ws://localhost:5006/ws"

class Test_ClientSession(object):

    def test_creation_defaults(self):
        s = bcs.ClientSession()
        assert s.connected == False
        assert s.document is None
        assert isinstance(s.id, string_types)
        assert len(s.id) == 44

    def test_creation_with_session_id(self):
        s = bcs.ClientSession("sid")
        assert s.connected == False
        assert s.document is None
        assert s.id == "sid"

    def test_creation_with_ws_url(self):
        s = bcs.ClientSession(websocket_url="wsurl")
        assert s.connected == False
        assert s.document is None
        assert s._connection.url == "wsurl"
        assert isinstance(s.id, string_types)
        assert len(s.id) == 44

    def test_creation_with_ioloop(self):
        s = bcs.ClientSession(io_loop="io_loop")
        assert s.connected == False
        assert s.document is None
        assert s._connection.io_loop == "io_loop"
        assert isinstance(s.id, string_types)
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

    @patch("warnings.warn")
    @patch("bokeh.client.connection.ClientConnection.loop_until_closed")
    def test_loop_until_closed(self, mock_loop_until_closed, mock_warn):
        s = bcs.ClientSession()
        s.loop_until_closed()
        assert mock_loop_until_closed.call_count == 1
        assert mock_loop_until_closed.call_args[0] == ()
        assert mock_loop_until_closed.call_args[1] == {}

        assert mock_warn.call_count == 1
        assert mock_warn.call_args[0] == (bcs._BOKEH_CLIENT_APP_WARNING_FULL,)
        assert mock_warn.call_args[1] == {}

    @patch("warnings.warn")
    @patch("bokeh.client.connection.ClientConnection.loop_until_closed")
    def test_loop_until_closed_suppress_warnings(self, mock_loop_until_closed, mock_warn):
        s = bcs.ClientSession()
        s.loop_until_closed(True)
        assert mock_loop_until_closed.call_count == 1
        assert mock_loop_until_closed.call_args[0] == ()
        assert mock_loop_until_closed.call_args[1] == {}

        assert mock_warn.call_count == 0

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
