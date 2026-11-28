#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from unittest.mock import MagicMock, patch

from bokeh.document import Document
from bokeh.document.events import ModelChangedEvent, TitleChangedEvent
from bokeh.models import ColumnDataSource
from bokeh.protocol import patch_doc

# Module under test
import bokeh.client.session as bcs # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_DEFAULT_SESSION_ID() -> None:
    assert bcs.DEFAULT_SESSION_ID == "default"

def test_DEFAULT_SERVER_WEBSOCKET_URL() -> None:
    assert bcs.DEFAULT_SERVER_WEBSOCKET_URL == "ws://localhost:5006/ws"


class Test_ClientSession:
    def test_creation_defaults(self) -> None:
        s = bcs.ClientSession()
        assert s.connected is False
        assert s.document is None
        assert s._connection._arguments is None
        assert isinstance(s.id, str)
        assert len(s.id) == 44

    def test_creation_with_session_id(self) -> None:
        s = bcs.ClientSession("sid")
        assert s.connected is False
        assert s.document is None
        assert s._connection._arguments is None
        assert s.id == "sid"

    def test_creation_with_ws_url(self) -> None:
        s = bcs.ClientSession(websocket_url="wsurl")
        assert s.connected is False
        assert s.document is None
        assert s._connection._arguments is None
        assert s._connection.url == "wsurl"
        assert isinstance(s.id, str)
        assert len(s.id) == 44

    def test_creation_with_ioloop(self) -> None:
        s = bcs.ClientSession(io_loop="io_loop")
        assert s.connected is False
        assert s.document is None
        assert s._connection._arguments is None
        assert s._connection.io_loop == "io_loop"
        assert isinstance(s.id, str)
        assert len(s.id) == 44

    def test_creation_with_arguments(self) -> None:
        s = bcs.ClientSession(arguments="args")
        assert s.connected is False
        assert s.document is None
        assert s._connection._arguments == "args"
        assert len(s.id) == 44

    @patch("bokeh.client.connection.ClientConnection.connect")
    def test_connect(self, mock_connect: MagicMock) -> None:
        s = bcs.ClientSession()
        s.connect()
        assert mock_connect.call_count == 1
        assert mock_connect.call_args[0] == ()
        assert mock_connect.call_args[1] == {}

    @patch("bokeh.client.connection.ClientConnection.close")
    def test_close(self, mock_close: MagicMock) -> None:
        s = bcs.ClientSession()
        s.close()
        assert mock_close.call_count == 1
        assert mock_close.call_args[0] == ("closed",)
        assert mock_close.call_args[1] == {}

    @patch("bokeh.client.connection.ClientConnection.close")
    def test_context_manager(self, mock_close: MagicMock) -> None:
        with bcs.ClientSession() as session:
            assert isinstance(session, bcs.ClientSession)
        assert mock_close.call_count == 1
        assert mock_close.call_args[0] == ("closed",)
        assert mock_close.call_args[1] == {}

    @patch("bokeh.client.connection.ClientConnection.close")
    def test_close_with_why(self, mock_close: MagicMock) -> None:
        s = bcs.ClientSession()
        s.close("foo")
        assert mock_close.call_count == 1
        assert mock_close.call_args[0] == ("foo",)
        assert mock_close.call_args[1] == {}

    @patch("bokeh.client.connection.ClientConnection.force_roundtrip")
    def test_force_roundtrip(self, mock_force_roundtrip: MagicMock) -> None:
        s = bcs.ClientSession()
        s.force_roundtrip()
        assert mock_force_roundtrip.call_count == 1
        assert mock_force_roundtrip.call_args[0] == ()
        assert mock_force_roundtrip.call_args[1] == {}

    def test_incoming_patch_does_not_echo(self) -> None:
        session = bcs.ClientSession()
        document = Document()
        source = ColumnDataSource(data=dict(x=[1]))
        document.add_root(source)
        session._attach_document(document)

        with patch.object(session._connection, "_send_patch_document") as send_patch:
            session._handle_patch(patch_doc([ModelChangedEvent(document, source, "name", "remote")]))
            assert source.name == "remote"
            send_patch.assert_not_called()

            source.name = "local"
            send_patch.assert_called_once()

    def test_held_remote_title_and_local_override(self) -> None:
        session = bcs.ClientSession()
        document = Document()
        session._attach_document(document)

        with patch.object(session._connection, "_send_patch_document") as send_patch:
            document.hold()
            session._handle_patch(patch_doc([TitleChangedEvent(document, "remote")]))
            document.unhold()
            send_patch.assert_not_called()

            document.hold()
            session._handle_patch(patch_doc([TitleChangedEvent(document, "remote again")]))
            document.title = "local"
            document.unhold()
            send_patch.assert_called_once()
            event = send_patch.call_args.args[1]
            assert isinstance(event, TitleChangedEvent)
            assert event.title == "local"
            assert event.setter is None

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
